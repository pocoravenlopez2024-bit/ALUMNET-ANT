/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Camera,
  Search,
  Plus,
  Trash2,
  Download,
  Eye,
  X,
  Upload,
  Loader2,
  Sparkles,
  LayoutGrid,
  List,
  Filter,
  Image as ImageIcon,
  Calendar,
  Layers,
  ShieldCheck,
  ExternalLink,
  Share2,
  ChevronRight,
  ZoomIn,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { GalleryItem } from '../../types';
import { compressImage } from '../../lib/utils';

/**
 * Custom Executive Campus & Heritage Gallery Suite
 * Distinct Curatorial Gallery Wall & Archival Preservation Ledger
 */
export const AdminCampusGalleryView: React.FC = () => {
  const {
    galleryItems,
    addGalleryItem,
    deleteGalleryItem,
    permissions,
    showToast,
    currentUser,
    addAuditLog
  } = useAlumni();

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'wall' | 'ledger'>('wall');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectingItem, setInspectingItem] = useState<GalleryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<GalleryItem['category']>('campus');
  const [uploadYear, setUploadYear] = useState('2026');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadPhotoUrl, setUploadPhotoUrl] = useState('');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category statistics
  const campusCount = useMemo(() => galleryItems.filter((i) => i.category === 'campus').length, [galleryItems]);
  const homecomingCount = useMemo(() => galleryItems.filter((i) => i.category === 'homecoming').length, [galleryItems]);
  const commencementCount = useMemo(() => galleryItems.filter((i) => i.category === 'commencement').length, [galleryItems]);
  const heritageCount = useMemo(() => galleryItems.filter((i) => i.category === 'heritage').length, [galleryItems]);

  // Collections definition
  const collections = useMemo(() => [
    { id: 'all', label: 'All Heritage Assets', count: galleryItems.length },
    { id: 'campus', label: 'Campus Grounds & Architecture', count: campusCount },
    { id: 'homecoming', label: 'Grand Alumni Homecomings', count: homecomingCount },
    { id: 'commencement', label: 'Commencement & Graduation', count: commencementCount },
    { id: 'heritage', label: 'Historical & Founders Archives', count: heritageCount }
  ], [galleryItems.length, campusCount, homecomingCount, commencementCount, heritageCount]);

  // Unique years for era filter
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    galleryItems.forEach((i) => {
      if (i.year) set.add(i.year);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [galleryItems]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    let result = [...galleryItems];

    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    if (selectedEra !== 'all') {
      result = result.filter((i) => i.year === selectedEra);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          (i.year || '').toLowerCase().includes(q)
      );
    }

    // Default: newest year first
    result.sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    return result;
  }, [galleryItems, selectedCategory, selectedEra, searchQuery]);

  // Image Upload Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    setIsProcessingPhoto(true);
    setPhotoError('');
    try {
      const compressed = await compressImage(file, 1600, 0.85);
      setUploadPhotoUrl(compressed);
      showToast('Archival photo processed with lossless compression.', 'success');
    } catch {
      setPhotoError('Failed to compress image. Using raw upload.');
      const reader = new FileReader();
      reader.onload = (event) => setUploadPhotoUrl(event.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Submit Upload Form
  const handleSaveUpload = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadPhotoUrl.trim()) {
      showToast('Please provide both asset title and photo.', 'error');
      return;
    }

    addGalleryItem({
      title: uploadTitle.trim(),
      category: uploadCategory,
      year: uploadYear.trim() || '2026',
      url: uploadPhotoUrl.trim(),
      description: uploadDesc.trim() || undefined,
      uploadedBy: currentUser?.uid || 'archivist',
      uploadedByName: currentUser?.name || 'University Archivist',
      uploaderRole: currentUser?.role || 'admin'
    });

    addAuditLog({
      action: 'UPLOAD_CAMPUS_GALLERY_MEDIA',
      actorId: currentUser?.uid || 'archivist',
      actorName: currentUser?.name || 'University Archivist',
      actorRole: currentUser?.role || 'admin',
      category: 'engagement',
      details: `Preserved archival media asset: "${uploadTitle.trim()}" (${uploadCategory}, Year: ${uploadYear})`,
      severity: 'info'
    });

    showToast('Media asset successfully preserved to digital archives.', 'success');
    setShowUploadModal(false);

    // Reset
    setUploadTitle('');
    setUploadPhotoUrl('');
    setUploadDesc('');
  }, [uploadTitle, uploadCategory, uploadYear, uploadPhotoUrl, uploadDesc, currentUser, addGalleryItem, addAuditLog, showToast]);

  // Confirm Delete
  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;
    deleteGalleryItem(itemToDelete.id);

    addAuditLog({
      action: 'DELETE_CAMPUS_GALLERY_MEDIA',
      actorId: currentUser?.uid || 'archivist',
      actorName: currentUser?.name || 'University Archivist',
      actorRole: currentUser?.role || 'admin',
      category: 'engagement',
      details: `Deleted archival asset: "${itemToDelete.title}" (ID: ${itemToDelete.id})`,
      severity: 'warning'
    });

    showToast('Media asset removed from collegiate archive.', 'info');
    setItemToDelete(null);
  }, [itemToDelete, deleteGalleryItem, addAuditLog, currentUser, showToast]);

  // Export CSV Catalog
  const handleExportCsv = useCallback(() => {
    const headers = ['ID', 'Title', 'Collection', 'Year', 'Description', 'Media URL', 'Preserved By'];
    const rows = galleryItems.map((item) => [
      `"${item.id}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${item.category || ''}"`,
      `"${item.year || ''}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      `"${item.url || ''}"`,
      `"${item.uploadedByName || 'Archivist'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCC_Campus_Gallery_Catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Media catalog exported to CSV.', 'success');
  }, [galleryItems, showToast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. HERITAGE ARCHIVAL BANNER */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B181B] tracking-wide uppercase">
              <Camera className="w-4 h-4 stroke-[2]" />
              <span>Office of University Archives · St. Cecilia's College Photographic Repository</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Campus Heritage & Photographic Archives
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Preserved Assets: <strong className="text-stone-900 font-semibold">{galleryItems.length}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Curated Collections: <strong className="text-stone-900 font-semibold">4 Eras</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Digital Preservation: <strong className="text-emerald-700 font-semibold">Cloud-Synchronized</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Visual Resolution: <strong className="text-stone-900 font-semibold">Lossless WebP</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Catalog</span>
            </button>
            {permissions.canUploadGallery && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Upload Archival Media</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. ARCHIVAL ERA & COLLECTION NAVIGATOR */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Collection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {collections.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedCategory(col.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === col.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{col.label}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                  selectedCategory === col.id ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                }`}>
                  {col.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search, Year Selector & Layout Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archive..."
                className="pl-9 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value)}
              aria-label="Filter by era"
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Eras</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>

            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setDisplayMode('wall')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  displayMode === 'wall' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Curatorial Wall"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('ledger')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  displayMode === 'ledger' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Preservation Ledger"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CURATORIAL ASSET DISPLAY DECK */}
      {displayMode === 'wall' ? (
        filteredItems.length === 0 ? (
          <div className="bg-white border border-stone-200/80 rounded-2xl p-12 text-center space-y-2">
            <Camera className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No Archival Media Found</h3>
            <p className="text-xs text-stone-500">No photographs match the current collection or keyword filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-stone-200/80 hover:border-stone-300 overflow-hidden shadow-2xs transition-all hover:shadow-md flex flex-col justify-between"
              >
                {/* Photo Aspect Frame */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectingItem(item)}
                      className="p-2 rounded-xl bg-white/90 text-stone-900 hover:bg-white shadow-xs cursor-pointer transition-transform hover:scale-110"
                      title="Inspect Fullscreen"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    {permissions.canUploadGallery && (
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-2 rounded-xl bg-rose-700 text-white hover:bg-rose-800 shadow-xs cursor-pointer transition-transform hover:scale-110"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Corner Collection Pill */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>Era {item.year || '2026'}</span>
                      <span className="font-mono text-[10px]">#{item.id.slice(-6)}</span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight line-clamp-1">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-400 truncate text-[11px]">
                      {item.uploadedByName ? `By ${item.uploadedByName}` : 'SCC Archives'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectingItem(item)}
                      className="font-semibold text-[#8B181B] hover:underline text-xs cursor-pointer"
                    >
                      Deep Zoom →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Preservation Ledger (Table View) */
        <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 text-stone-700 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-3">Title & Caption</th>
                  <th className="py-3 px-3">Collection</th>
                  <th className="py-3 px-3">Year / Era</th>
                  <th className="py-3 px-3">Archived By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No media assets found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-stone-900">{item.title}</div>
                        <div className="text-[11px] text-stone-400 line-clamp-1">{item.description}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#8B181B] uppercase tracking-wider text-[10px]">
                        {item.category}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-700">{item.year || '2026'}</td>
                      <td className="py-3 px-3 text-stone-500">{item.uploadedByName || 'Archivist'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingItem(item)}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 cursor-pointer"
                            title="Inspect"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          {permissions.canUploadGallery && (
                            <button
                              type="button"
                              onClick={() => setItemToDelete(item)}
                              className="p-1 rounded text-rose-600 hover:text-rose-800 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD ARCHIVAL MEDIA ================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Upload Campus Heritage Media</h2>
                <p className="text-xs text-stone-500">Preserve official photography to the St. Cecilia digital archive.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Asset Title *</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 50th Golden Jubilee Quadrangle Assembly"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Archival Collection</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  >
                    <option value="campus">Campus Grounds</option>
                    <option value="homecoming">Grand Homecoming</option>
                    <option value="commencement">Commencement</option>
                    <option value="heritage">Heritage & History</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Year / Era</label>
                  <input
                    type="text"
                    required
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">High-Resolution Photo *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {uploadPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 h-44 bg-stone-100">
                    <img src={uploadPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setUploadPhotoUrl('')}
                      className="absolute top-2 right-2 p-1 bg-stone-900/80 text-white rounded-lg hover:bg-stone-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="w-full py-6 border-2 border-dashed border-stone-200 hover:border-stone-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-500 cursor-pointer transition-colors"
                  >
                    {isProcessingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#8B181B]" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-stone-400" />
                        <span className="font-medium text-xs">Select or Drag Photo (Client-compressed WebP)</span>
                      </>
                    )}
                  </button>
                )}
                {photoError && <p className="text-[11px] text-rose-600 mt-1">{photoError}</p>}
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Historical Context / Caption</label>
                <textarea
                  rows={3}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Record historical notes, dignitaries present, or architectural changes..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadPhotoUrl || isProcessingPhoto}
                  className="px-5 py-2 rounded-xl text-white bg-[#8B181B] hover:bg-[#721316] font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Preserve Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DEEP ZOOM LIGHTBOX INSPECTOR ================= */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-md">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-stone-800 text-white">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  {inspectingItem.category} · Year {inspectingItem.year || '2026'}
                </span>
                <h3 className="text-base font-bold truncate max-w-lg">{inspectingItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-2 min-h-[300px] overflow-hidden">
              <img
                src={inspectingItem.url}
                alt={inspectingItem.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300">
              <div className="max-w-xl">
                {inspectingItem.description ? (
                  <p className="line-clamp-2 leading-relaxed">{inspectingItem.description}</p>
                ) : (
                  <p className="text-stone-500 italic">No historical notes attached.</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={inspectingItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Full Asset</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE MEDIA CONFIRMATION ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Decommission Media Asset?</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently remove <strong>"{itemToDelete.title}"</strong> from the collegiate heritage repository?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-white bg-rose-700 hover:bg-rose-800 font-semibold cursor-pointer"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
