import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Award,
  Image as ImageIcon,
  Megaphone,
  ThumbsUp,
  Heart,
  MessageSquare,
  Share2,
  Pin,
  Send,
  Trash2,
  CheckCircle2,
  Globe,
  Upload,
  Camera,
  X,
  Plus,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  Bookmark
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { InstitutionalFeedPost, FeedComment } from '../../types';
import { validateUploadedFile } from '../../lib/security';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { InteractiveHeartReaction, DoubleTapHeartOverlay } from '../common/InteractiveHeartReaction';
import { Skeleton } from '../common/BentoSkeleton';

const PRESET_CAMPUS_PHOTOS = [
  {
    name: "St. Cecilia's Tower Complex",
    url: '/assets/landing-building-1.jpg',
    desc: 'Modern academic landmark tower'
  },
  {
    name: 'Main Campus Academic Hall',
    url: '/assets/landing-building-2.jpg',
    desc: 'Administration & collegiate classrooms'
  },
  {
    name: 'Courtyard & Student Pavilion',
    url: '/assets/landing-building-3.jpg',
    desc: 'Refurbished open promenade'
  },
  {
    name: "St. Cecilia's College Seal",
    url: '/assets/st-cecilias-college-seal.jpg',
    desc: 'Official Institutional Circular Seal'
  }
];

interface InstitutionalSocialFeedProps {
  alumniOnly?: boolean;
  isLoading?: boolean;
}

export const InstitutionalSocialFeed: React.FC<InstitutionalSocialFeedProps> = ({ alumniOnly, isLoading: propIsLoading }) => {
  const {
    currentUser,
    users,
    feedPosts,
    addFeedPost,
    toggleHeartFeedPost,
    toggleLikeFeedPost,
    addFeedPostComment,
    deleteFeedPost,
    showToast,
    isLoadingData
  } = useAlumni();

  const isLoading = propIsLoading ?? isLoadingData;

  const [activeFilter, setActiveFilter] = useState<'all' | 'milestone' | 'gallery' | 'announcement'>('all');
  const [showComposerModal, setShowComposerModal] = useState(false);
  const [composerType, setComposerType] = useState<'milestone' | 'gallery' | 'announcement'>('milestone');
  
  // Composer Form States
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postMilestoneBadge, setPostMilestoneBadge] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [postTags, setPostTags] = useState('');

  // Active hovered post for side-hover comments panel (None open by default)
  const [activeHoverPostId, setActiveHoverPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Image Lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Destructive confirmation state (Requirement 5)
  const [postToDelete, setPostToDelete] = useState<{ id: string; title: string } | null>(null);

  // Check if current user is permitted to post
  // Admins, staff, moderators, and verified alumni can publish posts
  const canPublishPost = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.role !== 'employer' && (currentUser.role !== 'alumni' || currentUser.isVerified);
  }, [currentUser]);

  // Filtered Posts: Do not display posts in the dashboard of admins, except from the alumni
  const displayedPosts = useMemo(() => {
    let posts = [...feedPosts];
    const isAdminUser = currentUser && currentUser.role !== 'alumni';
    if (alumniOnly || isAdminUser) {
      posts = posts.filter((p) => p.authorRole === 'alumni');
    }
    if (activeFilter !== 'all') {
      posts = posts.filter((p) => p.postType === activeFilter);
    }
    // Sort pinned posts first, then newest
    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [feedPosts, activeFilter, alumniOnly, currentUser]);

  const activeHoverPost = useMemo(() => {
    if (!activeHoverPostId) return null;
    return displayedPosts.find((p) => p.id === activeHoverPostId) || null;
  }, [activeHoverPostId, displayedPosts]);

  // If user is an admin and there are no posts from alumni, do not display the section
  if (currentUser && currentUser.role !== 'alumni' && displayedPosts.length === 0) {
    return null;
  }

  const handleOpenComposer = (type: 'milestone' | 'gallery' | 'announcement') => {
    setComposerType(type);
    if (type === 'milestone') {
      setPostTitle('Historic Institutional Milestone Achieved');
      setPostMilestoneBadge('Excellence Award');
      setPostImageUrl('/assets/st-cecilias-college-seal.jpg');
    } else if (type === 'gallery') {
      setPostTitle('Campus Landmark & Gallery Update');
      setPostImageUrl('/assets/landing-building-1.jpg');
      setPostMilestoneBadge('');
    } else {
      setPostTitle('Official Institutional Announcement');
      setPostMilestoneBadge('');
    }
    setShowComposerModal(true);
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Please provide both a title and description for the post.', 'warning');
      return;
    }

    const tagsArray = postTags
      ? postTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [composerType === 'milestone' ? 'Milestone' : composerType === 'gallery' ? 'Campus Gallery' : 'Official Update'];

    const success = addFeedPost({
      postType: composerType,
      title: postTitle.trim(),
      content: postContent.trim(),
      imageUrl: postImageUrl.trim() || undefined,
      milestoneBadge: composerType === 'milestone' ? (postMilestoneBadge.trim() || 'Milestone') : undefined,
      isPinned,
      tags: tagsArray
    });

    if (success) {
      setPostTitle('');
      setPostContent('');
      setPostImageUrl('');
      setPostMilestoneBadge('');
      setIsPinned(false);
      setPostTags('');
      setShowComposerModal(false);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateUploadedFile(file, 'images');
    if (!validation.valid) {
      showToast(validation.error || 'Invalid photo format.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPostImageUrl(event.target?.result as string);
      showToast('Photo uploaded and ready to attach.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const toggleCommentsSide = (postId: string) => {
    setActiveHoverPostId((prev) => (prev === postId ? null : postId));
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addFeedPostComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleShare = (post: InstitutionalFeedPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#feed-${post.id}`);
      showToast('Post link copied to clipboard!', 'info');
    } else {
      showToast('Shared with alumni network!', 'info');
    }
  };

  // Reusable collegiate comments thread component
  const renderCommentThread = (post: InstitutionalFeedPost, isDrawer = false) => {
    const comments = post.comments || [];
    const inputVal = commentInputs[post.id] || '';

    return (
      <div className="flex flex-col h-full bg-white relative">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-stone-200 bg-stone-50/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-100 text-[#8B181B] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                  Comments
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#8B181B] text-white">
                  {comments.length}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 truncate">
                On {post.authorName}'s post
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveHoverPostId(null)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            title="Close comments"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Comments List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2.5">
                <img
                  src={getUserAvatar(comment.authorAvatar)}
                  alt={comment.authorName}
                  onError={handleUserAvatarError}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-stone-200 shrink-0 mt-0.5"
                />
                <div className="flex-1 bg-stone-50/90 p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900">{comment.authorName}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(comment.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-stone-700 mt-1 leading-relaxed break-words">{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-2.5 text-stone-400">
                <MessageSquare className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-semibold text-stone-700">No comments yet</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-[220px]">
                Be the first Cecilian to share your thoughts or congratulations!
              </p>
            </div>
          )}
        </div>

        {/* Sticky Comment Composer */}
        <div className="p-3 sm:p-3.5 border-t border-stone-200 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={getUserAvatar(currentUser?.profilePictureUrl)}
              alt={currentUser?.name || 'User'}
              onError={handleUserAvatarError}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-stone-200 shrink-0"
            />
            <div className="flex-1 flex items-center gap-1.5 bg-stone-50 rounded-xl border border-stone-200 px-3 py-1.5 shadow-2xs focus-within:bg-white focus-within:ring-2 focus-within:ring-[#8B181B]/20 focus-within:border-[#8B181B]">
              <input
                type="text"
                value={inputVal}
                onChange={(e) =>
                  setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendComment(post.id);
                  }
                }}
                placeholder={
                  currentUser
                    ? `Write a comment as ${currentUser.name}...`
                    : 'Sign in to leave a comment...'
                }
                disabled={!currentUser}
                className="flex-1 text-xs bg-transparent focus:outline-none text-stone-800 disabled:bg-transparent"
              />
              <button
                type="button"
                onClick={() => handleSendComment(post.id)}
                disabled={!currentUser || !inputVal.trim()}
                className="p-1.5 text-[#8B181B] hover:bg-red-50 rounded-lg disabled:text-stone-300 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Post Comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div id="institutional-feed-container" className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-5">
        {/* Header Skeleton */}
        <div className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-72 rounded" />
            </div>
            <Skeleton className="h-8 w-24 rounded-xl shrink-0" />
          </div>
          <div className="flex gap-1.5 pt-2 border-t border-stone-100 dark:border-stone-800 overflow-x-auto">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>

        {/* 3 Post Card Skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-2.5 w-40 rounded" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
            {i !== 3 && <Skeleton className="w-full h-52 rounded-xl" />}
            <div className="flex justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
              <div className="flex gap-4">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id="institutional-feed-container" className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-5">
      {/* Feed Header Banner & Filter Navigation */}
      <div className="w-full max-w-full overflow-x-hidden bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B181B] to-amber-600 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/assets/st-cecilias-college-seal.jpg"
                alt="St. Cecilia's College Seal"
                className="w-full h-full rounded-[10px] object-cover bg-white"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-extrabold text-stone-900 tracking-tight break-words">
                  Campus Feed & Milestones
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Official Posts
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-500 break-words leading-relaxed">
                Live updates, campus gallery photos, and achievements from College Administration & Staff
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#991B1B] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              All Posts ({feedPosts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('milestone')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'milestone'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Milestones</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('gallery')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'gallery'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Campus Gallery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('announcement')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeFilter === 'announcement'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Bulletins</span>
            </button>
          </div>
        </div>

        {/* Facebook-style "Create Post" Box (Visible only for Admin, Registrar, Staff, Faculty) */}
        {canPublishPost ? (
          <div className="mt-4 pt-1">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <img
                src={getUserAvatar(currentUser?.profilePictureUrl)}
                alt={currentUser?.name || 'Staff'}
                onError={handleUserAvatarError}
                className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
              />
              <button
                type="button"
                onClick={() => handleOpenComposer('milestone')}
                className="flex-1 text-left px-4 py-2.5 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-xs sm:text-sm text-stone-500 transition-colors shadow-2xs cursor-pointer truncate"
              >
                Post a campus milestone, gallery photo, or institutional bulletin...
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleOpenComposer('gallery')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-emerald-50 text-emerald-800 font-semibold transition-colors border border-transparent hover:border-emerald-200 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span className="truncate">Campus Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer('milestone')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-amber-50 text-amber-900 font-semibold transition-colors border border-transparent hover:border-amber-200 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span className="truncate">Post Milestone</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenComposer('announcement')}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-blue-50 text-blue-800 font-semibold transition-colors border border-transparent hover:border-blue-200 cursor-pointer"
              >
                <Megaphone className="w-4 h-4 text-blue-600" />
                <span className="truncate">Official Bulletin</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-2 px-3 py-2 bg-stone-50/80 rounded-xl text-xs text-stone-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official institutional announcements and campus photo updates verified by College Administration.</span>
            </span>
            <span className="text-[11px] font-bold text-[#991B1B] shrink-0">
              Verified Feed
            </span>
          </div>
        )}
      </div>

      {/* Social Feed List */}
      <div className="space-y-4 sm:space-y-5">
        {displayedPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center text-stone-500">
            <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">No feed posts in this category</p>
            <p className="text-xs text-stone-400 mt-1">Check back later for official campus milestones.</p>
          </div>
        ) : (
          displayedPosts.map((post) => {
            const isLikedByMe = currentUser ? (post.likes || []).includes(currentUser.uid) : false;
            const isHeartedByMe = currentUser ? ((post.hearts || post.likes || []).includes(currentUser.uid)) : false;
            const heartsCount = (post.hearts || post.likes || []).length;
            const reactorUids = post.hearts || post.likes || [];
            const isHoveredPost = activeHoverPostId === post.id;
            const isAuthorOrAdmin = currentUser && (currentUser.role === 'admin' || post.authorId === currentUser.uid);

            return (
              <article
                key={post.id}
                id={`feed-${post.id}`}
                className={`w-full max-w-full overflow-x-hidden bg-white rounded-2xl border transition-all duration-300 relative ${
                  isHoveredPost
                    ? 'ring-2 ring-[#8B181B]/40 shadow-[0_16px_40px_rgba(139,24,27,0.14),0_6px_20px_rgba(0,0,0,0.06)] scale-[1.01] -translate-y-1 border-[#8B181B]/50 z-30'
                    : 'border-stone-200/90 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Pinned Post Indicator */}
                {post.isPinned && (
                  <div className="bg-gradient-to-r from-amber-500/10 via-red-500/5 to-transparent px-4 py-1.5 border-b border-amber-200/50 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-900 font-bold">
                    <span className="flex items-center gap-1.5 truncate">
                      <Pin className="w-3.5 h-3.5 text-amber-700 rotate-45 shrink-0" />
                      <span className="truncate">Pinned by St. Cecilia's College Administration</span>
                    </span>
                    <span className="text-[10px] text-amber-700/80 font-normal shrink-0">Featured Priority</span>
                  </div>
                )}

                {/* Post Header */}
                <div className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={getUserAvatar(post.authorAvatar)}
                          alt={post.authorName}
                          onError={handleUserAvatarError}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-amber-200 shadow-2xs"
                        />
                        <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-0.5 rounded-full ring-2 ring-white" title="Verified College Entity">
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-stone-900 text-xs sm:text-sm md:text-base leading-snug break-words">
                            {post.authorName}
                          </h3>
                          <span
                            className={`px-2 py-0.2 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide rounded-full border shrink-0 ${
                              post.authorRole === 'admin'
                                ? 'bg-red-50 text-[#8B181B] border-red-200'
                                : post.authorRole === 'registrar'
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}
                          >
                            {post.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-stone-400 mt-0.5 flex-wrap">
                          <span>
                            {new Date(post.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-stone-500">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span>Public to all Alumni</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Post Category Badge & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold shrink-0 ${
                          post.postType === 'milestone'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : post.postType === 'gallery'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}
                      >
                        {post.postType === 'milestone' && <Award className="w-3.5 h-3.5 text-amber-700" />}
                        {post.postType === 'gallery' && <Camera className="w-3.5 h-3.5 text-emerald-700" />}
                        {post.postType === 'announcement' && <Megaphone className="w-3.5 h-3.5 text-blue-700" />}
                        <span className="capitalize">
                          {post.postType === 'milestone'
                            ? 'Milestone'
                            : post.postType === 'gallery'
                            ? 'Campus Gallery'
                            : 'Bulletin'}
                        </span>
                      </span>

                      {isAuthorOrAdmin && (
                        <button
                          type="button"
                          onClick={() => setPostToDelete({ id: post.id, title: post.title })}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Title & Text Content */}
                  <div className="mt-3.5">
                    <h4 className="font-extrabold text-sm sm:text-base md:text-lg text-stone-900 tracking-tight leading-snug break-words">
                      {post.title}
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line break-words">
                      {post.content}
                    </p>
                  </div>

                  {/* Milestone Highlight Banner if milestone */}
                  {post.postType === 'milestone' && post.milestoneBadge && (
                    <div className="mt-3.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border border-amber-300/80 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500 text-white shadow-xs shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                          Official Institutional Honor
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                          {post.milestoneBadge}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campus Gallery Image (Full Width Media Attachment with Double-Tap Heart Interaction) */}
                {post.imageUrl && (
                  <DoubleTapHeartOverlay onTrigger={() => toggleHeartFeedPost(post.id)}>
                    <div className="relative group overflow-hidden bg-stone-900 max-h-[460px] flex items-center justify-center border-y border-stone-200">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover max-h-[460px] transition-transform duration-300 group-hover:scale-[1.01] cursor-pointer"
                        onClick={() => setLightboxImage({ url: post.imageUrl!, title: post.title })}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage({ url: post.imageUrl!, title: post.title })}
                        className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-xs flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="View Full Resolution"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span>Expand Photo</span>
                      </button>
                    </div>
                  </DoubleTapHeartOverlay>
                )}

                {/* Engagement / Reaction Counts */}
                <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-stone-500 border-b border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center -space-x-1">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-2xs">
                        <Heart className="w-3 h-3 fill-current" />
                      </span>
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-2xs">
                        👍
                      </span>
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-2xs">
                        🎉
                      </span>
                    </div>
                    <span className="font-semibold text-stone-700 ml-1">
                      {heartsCount} {heartsCount === 1 ? 'heart reaction' : 'heart reactions'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCommentsSide(post.id)}
                      className="hover:underline cursor-pointer flex items-center gap-1.5 text-stone-600 hover:text-[#8B181B] transition-colors"
                      title="View comments"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-stone-400" />
                      <span>{(post.comments || []).length} {(post.comments || []).length === 1 ? 'comment' : 'comments'}</span>
                    </button>
                    <span>•</span>
                    <span>{post.sharesCount} shares</span>
                  </div>
                </div>

                {/* Social Action Buttons with Interactive Heart Reaction */}
                <div className="px-2 sm:px-4 py-1.5 grid grid-cols-3 gap-1 text-xs font-semibold text-stone-600">
                  <InteractiveHeartReaction
                    isHearted={isHeartedByMe}
                    heartsCount={heartsCount}
                    onToggle={() => toggleHeartFeedPost(post.id)}
                    reactorUids={reactorUids}
                    allUsers={users}
                    variant="button"
                    label={isHeartedByMe ? 'Hearted' : 'Heart'}
                    className="w-full"
                  />

                  <button
                    type="button"
                    onClick={() => toggleCommentsSide(post.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                      isHoveredPost
                        ? 'bg-red-50 text-[#8B181B] font-bold ring-1 ring-red-200 shadow-2xs'
                        : 'hover:bg-stone-100 text-stone-600'
                    }`}
                    title="Toggle comment side panel"
                  >
                    <MessageSquare className={`w-4 h-4 ${isHoveredPost ? 'text-[#8B181B]' : ''}`} />
                    <span>Comment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(post)}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Side Slide-Over Drawer for Comments */}
      {activeHoverPost && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setActiveHoverPostId(null)}
        >
          <div
            className="w-full sm:w-[440px] h-full bg-white shadow-2xl flex flex-col border-l border-stone-200 animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {renderCommentThread(activeHoverPost, true)}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Gallery */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              className="w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-black"
            />
            <p className="text-white text-center text-sm font-semibold mt-3">
              {lightboxImage.title}
            </p>
          </div>
        </div>
      )}

      {/* Composer Modal for Admin, Registrar, Staff */}
      {showComposerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in"
          onClick={() => setShowComposerModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 max-w-xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 text-[#8B181B]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                    Publish Institutional Feed Post
                  </h3>
                  <p className="text-xs text-stone-500">
                    Visible immediately to all alumni in their dashboard feed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComposerModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Post Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setComposerType('milestone');
                      if (!postMilestoneBadge) setPostMilestoneBadge('Excellence Award');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      composerType === 'milestone'
                        ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Milestone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposerType('gallery');
                      if (!postImageUrl) setPostImageUrl('/assets/landing-building-1.jpg');
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      composerType === 'gallery'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Campus Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerType('announcement')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      composerType === 'announcement'
                        ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    <span>Bulletin</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Post Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Unveiling of the New High-Rise Academic Tower"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                />
              </div>

              {/* Milestone Badge if milestone */}
              {composerType === 'milestone' && (
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Milestone Achievement Badge
                  </label>
                  <input
                    type="text"
                    value={postMilestoneBadge}
                    onChange={(e) => setPostMilestoneBadge(e.target.value)}
                    placeholder="e.g. 100% Passing Rate or Regional Topnotcher"
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-sm focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              )}

              {/* Content / Story */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Story & Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write the full announcement or celebration story for our alumni community..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                />
              </div>

              {/* Media Attachment */}
              <div className="border border-stone-200 rounded-2xl p-3.5 bg-stone-50/60">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-stone-500" />
                    <span>Campus Photo / Media Attachment</span>
                  </label>
                  {postImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPostImageUrl('')}
                      className="text-[11px] text-red-600 hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Preset Selector */}
                <p className="text-[11px] text-stone-500 mb-1.5">Choose from official campus landmarks:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
                  {PRESET_CAMPUS_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPostImageUrl(preset.url)}
                      className={`text-left p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                        postImageUrl === preset.url
                          ? 'border-blue-600 bg-blue-50 font-bold text-blue-900'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-12 rounded object-cover mb-1" />
                      <span className="truncate block">{preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Or Custom Upload */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-stone-300 bg-white hover:bg-stone-100 text-xs font-semibold text-stone-600 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Photo</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    placeholder="Or enter image URL..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs bg-white"
                  />
                </div>

                {postImageUrl && (
                  <div className="mt-2.5 relative rounded-xl overflow-hidden border border-stone-200 h-28 bg-stone-900">
                    <img src={postImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Pinned Post Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-2">
                  <Pin className="w-4 h-4 text-amber-700 rotate-45" />
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Pin to Top of Alumni Dashboard
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Keep this post featured prominently as the top announcement
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-[#8B181B] rounded focus:ring-[#8B181B]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  placeholder="e.g. Campus Expansion, Milestone, IT Department"
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              {/* Sticky Action Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 border-t border-stone-200 flex items-center justify-end gap-2 shadow-xs z-10">
                <button
                  type="button"
                  onClick={() => setShowComposerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7f1616] shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Publish to Alumni Feed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive Post Deletion (Requirement 5) */}
      <ConfirmationModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => {
          if (postToDelete) {
            deleteFeedPost(postToDelete.id);
          }
          setPostToDelete(null);
        }}
        title="Delete Feed Post"
        message={`Are you sure you want to permanently delete "${postToDelete?.title}" from the Alumni Feed? This action cannot be undone.`}
        confirmLabel="Delete Post"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
};
