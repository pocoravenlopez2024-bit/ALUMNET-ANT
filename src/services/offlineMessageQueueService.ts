/**
 * St. Cecilia's College - Cecilian Alumnet
 * Offline Outgoing Message Queue Service
 *
 * Allows users to compose and dispatch peer & event messages while disconnected.
 * Messages are persistently stored in local device storage and automatically synchronized
 * to Firestore and recipient channels once network connectivity is restored.
 */

import { ChatMessage } from '../types';
import { saveChatMessageToFirestore } from '../lib/firebase';
import { triggerHaptic } from './hapticsService';

export const OFFLINE_QUEUE_STORAGE_KEY = 'alumni_offline_message_queue_v1';

export interface QueuedOfflineMessage extends ChatMessage {
  status: 'queued' | 'syncing' | 'failed' | 'sent';
  queuedAt: string;
  retryCount: number;
  lastError?: string;
}

let isSyncing = false;

/**
 * Retrieves all pending messages currently in the offline queue
 */
export function getOfflineMessageQueue(): QueuedOfflineMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading offline message queue:', err);
    return [];
  }
}

/**
 * Saves the offline message queue to local storage and dispatches change event
 */
function saveOfflineMessageQueue(queue: QueuedOfflineMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(
      new CustomEvent('applet:offline-queue-change', {
        detail: { count: queue.length, queue }
      })
    );
  } catch (err) {
    console.warn('Error writing offline message queue:', err);
  }
}

/**
 * Enqueues an outgoing message composed while offline
 */
export function enqueueOfflineMessage(
  chatId: string,
  message: ChatMessage
): QueuedOfflineMessage {
  const queuedMsg: QueuedOfflineMessage = {
    ...message,
    status: 'queued',
    offlineQueued: true,
    queuedAt: new Date().toISOString(),
    retryCount: 0
  };

  const queue = getOfflineMessageQueue();
  // Prevent duplicate insertion
  const existingIdx = queue.findIndex((m) => m.id === message.id);
  if (existingIdx >= 0) {
    queue[existingIdx] = queuedMsg;
  } else {
    queue.push(queuedMsg);
  }

  saveOfflineMessageQueue(queue);
  triggerHaptic('selection');
  return queuedMsg;
}

/**
 * Removes a message from the offline queue (e.g. after successful delivery or user cancellation)
 */
export function removeOfflineMessage(messageId: string): void {
  const queue = getOfflineMessageQueue();
  const filtered = queue.filter((m) => m.id !== messageId);
  saveOfflineMessageQueue(filtered);
}

/**
 * Returns all queued messages destined for a specific chat thread
 */
export function getQueuedMessagesForChat(chatId: string): QueuedOfflineMessage[] {
  return getOfflineMessageQueue().filter((m) => m.chatId === chatId);
}

/**
 * Automatically syncs and delivers all pending messages in the queue to Firestore
 */
export async function syncOfflineMessageQueue(options?: {
  onProgress?: (synced: number, total: number) => void;
  onMessageSynced?: (syncedMsg: QueuedOfflineMessage) => void;
}): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof window === 'undefined') return { syncedCount: 0, failedCount: 0 };
  if (isSyncing) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const queue = getOfflineMessageQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  // Quick verify network reachability
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: queue.length };
  }

  isSyncing = true;
  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue: QueuedOfflineMessage[] = [];

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    item.status = 'syncing';

    try {
      // 1. Deliver message payload to Firestore
      const cleanMsg: ChatMessage = {
        id: item.id,
        chatId: item.chatId,
        senderId: item.senderId,
        senderName: item.senderName,
        senderAvatar: item.senderAvatar,
        senderRole: item.senderRole,
        text: item.text,
        createdAt: item.createdAt,
        status: 'sent',
        offlineQueued: false
      };

      await saveChatMessageToFirestore(item.chatId, cleanMsg);

      // 2. Dispatch custom event so context & UI update the bubble status from 'queued' to 'sent'
      window.dispatchEvent(
        new CustomEvent('applet:message-synced', {
          detail: { messageId: item.id, chatId: item.chatId, cleanMsg }
        })
      );

      if (options?.onMessageSynced) {
        options.onMessageSynced({ ...item, status: 'sent', offlineQueued: false });
      }

      syncedCount++;
      if (options?.onProgress) {
        options.onProgress(syncedCount, queue.length);
      }
    } catch (err: any) {
      console.warn(`[Offline Queue] Failed to sync message ${item.id}:`, err);
      failedCount++;
      remainingQueue.push({
        ...item,
        status: 'failed',
        retryCount: (item.retryCount || 0) + 1,
        lastError: err?.message || 'Network sync error'
      });
    }
  }

  // Save remaining (failed) items
  saveOfflineMessageQueue(remainingQueue);
  isSyncing = false;

  if (syncedCount > 0) {
    triggerHaptic('success');
    window.dispatchEvent(
      new CustomEvent('applet:offline-messages-synced', {
        detail: { syncedCount, failedCount }
      })
    );
  }

  return { syncedCount, failedCount };
}

/**
 * Manually retries sending a failed message
 */
export async function retryQueuedMessage(messageId: string): Promise<boolean> {
  const queue = getOfflineMessageQueue();
  const target = queue.find((m) => m.id === messageId);
  if (!target) return false;

  try {
    const cleanMsg: ChatMessage = {
      id: target.id,
      chatId: target.chatId,
      senderId: target.senderId,
      senderName: target.senderName,
      senderAvatar: target.senderAvatar,
      senderRole: target.senderRole,
      text: target.text,
      createdAt: target.createdAt,
      status: 'sent',
      offlineQueued: false
    };

    await saveChatMessageToFirestore(target.chatId, cleanMsg);
    removeOfflineMessage(messageId);

    window.dispatchEvent(
      new CustomEvent('applet:message-synced', {
        detail: { messageId: target.id, chatId: target.chatId, cleanMsg }
      })
    );

    triggerHaptic('success');
    return true;
  } catch (err) {
    console.warn(`Retry failed for message ${messageId}:`, err);
    target.status = 'failed';
    target.retryCount = (target.retryCount || 0) + 1;
    saveOfflineMessageQueue(queue);
    triggerHaptic('error');
    return false;
  }
}
