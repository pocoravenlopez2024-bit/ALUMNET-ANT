import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Shield,
  Calendar,
  Tag,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { GalleryItem } from '../../types';
import { validateUploadedFile } from '../../lib/security';

interface CampusGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    title: "St. Cecilia's Tower Complex",
    category: 'campus' as const,
    year: '2026 Landmark',
    url: '/assets/landing-building-1.jpg',
    description: 'Modern academic high-rise tower landmark reaching into the Cebu skies.'
  },
  {
    title: "St. Cecilia's College Main Hall",
    category: 'campus' as const,
    year: 'Academic Center',
    url: '/assets/landing-building-2.jpg',
    description: 'Main campus building featuring official entrance canopy and learning facilities.'
  },
  {
    title: 'Collegiate Courtyard & Grounds',
    category: 'campus' as const,
    year: 'Campus Life',
    url: '/assets/landing-building-3.jpg',
    description: 'Campus open grounds, pavilion, and student gathering spaces.'
  },
  {
    title: "Official College Seal of St. Cecilia's",
    category: 'heritage' as const,
    year: '1999 Founding',
    url: '/assets/st-cecilias-college-seal.jpg',
    description: "Official institutional circular seal of St. Cecilia's College - Cebu, Inc., Est. 1999."
  },
  {
    title: 'University Library & Digital Archives',
    category: 'campus' as const,
    year: '2026',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80',
    description: 'Renovated university library wing housing academic journals and digital research hubs.'
  },
  {
    title: 'Silver Jubilarian Torch Ceremony',
    category: 'homecoming' as const,
    year: '2025 Reunion',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80',
    description: 'Annual lighting of the alumni torch by Class of 2000 Silver Jubilarians.'
  },
  {
    title: 'Baccalaureate Mass & Honors Investiture',
    category: 'commencement' as const,
    year: 'Batch 2025',
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80',
    description: 'Conferment ceremony for graduating seniors in the University Auditorium.'
  }
];

export const CampusGalleryModal: React.FC<CampusGalleryModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentUser,
    galleryItems,
    addGalleryItem,
    deleteGalleryItem,
    permissions
  } = useAlumni();

  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'campus' | 'homecoming' | 'commencement' | 'heritage'
  >('all');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'campus' | 'homecoming' | 'commencement' | 'heritage'>('campus');
  const [newYear, setNewYear] = useState('2026');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Selected item for full-view modal
  const [inspectingItem, setInspectingItem] = useState<GalleryItem | null>(null);
  // Item pending deletion confirmation
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  // Keyboard shortcut (Escape) to close dialogs, and prevent body background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (itemToDelete) {
          setItemToDelete(null);
        } else if (inspectingItem) {
          setInspectingItem(null);
        } else if (showUploadModal) {
          setShowUploadModal(false);
        } else {
          onClose();
        }
      }
    };

    const handleCloseEvent = () => {
      if (itemToDelete) {
        setItemToDelete(null);
      } else if (inspectingItem) {
        setInspectingItem(null);
      } else if (showUploadModal) {
        setShowUploadModal(false);
      } else {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('applet:close-gallery', handleCloseEvent);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('applet:close-gallery', handleCloseEvent);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, itemToDelete, inspectingItem, showUploadModal, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const canUpload = permissions.canUploadGallery; // Admin and Registrar only

  const filteredItems =
    selectedCategory === 'all'
      ? galleryItems
      : galleryItems.filter((item) => item.category === selectedCategory);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const val = await validateUploadedFile(file, 'images');
      if (!val.valid) {
        setUploadError(val.error || 'Invalid image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUrl(reader.result as string);
        setUploadError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SAMPLE_PHOTOS[0]) => {
    setNewTitle(preset.title);
    setNewCategory(preset.category);
    setNewYear(preset.year);
    setNewUrl(preset.url);
    setNewDescription(preset.description);
    setUploadError('');
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload) {
      setUploadError('Only Admin and Registrar can upload to the Campus & Heritage Gallery.');
      return;
    }
    if (!newTitle.trim()) {
      setUploadError('Please provide a photo title.');
      return;
    }
    if (!newUrl.trim()) {
      setUploadError('Please provide an image URL or upload a file.');
      return;
    }

    const success = addGalleryItem({
      title: newTitle.trim(),
      category: newCategory,
      year: newYear.trim() || '2026',
      url: newUrl.trim(),
      description: newDescription.trim() || undefined
    });

    if (success) {
      // Reset form
      setNewTitle('');
      setNewCategory('campus');
      setNewYear('2026');
      setNewUrl('');
      setNewDescription('');
      setUploadError('');
      setShowUploadModal(false);
    }
  };

  return createPortal(
    <div
      data-campus-gallery-modal="true"
      className="fixed inset-0 z-[100] bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="campus-gallery-title"
    >
      {/* Floating Card Container */}
      <div
        className="relative bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-8 max-h-[88vh] overflow-y-auto shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-stone-200/90 flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-4 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8B181B]">
                ST. CECILIA'S COLLEGE - CEBU, INC.
              </span>
              <span className="text-stone-300">•</span>
              <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                ARCHIVAL COLLECTION
              </span>
            </div>
            <h3 id="campus-gallery-title" className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight mt-0.5">
              Campus & Heritage Gallery
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {canUpload ? (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono uppercase">
                  {currentUser?.role}
                </span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs border border-stone-200">
                <Shield className="w-3.5 h-3.5 text-[#8B181B]" />
                <span>Uploads restricted to <strong>Admin</strong> & <strong>Registrar</strong></span>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              aria-label="Close Gallery"
              title="Close Gallery (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Photos' },
              { id: 'campus', label: 'Campus & Facilities' },
              { id: 'commencement', label: 'Commencement & Honors' },
              { id: 'homecoming', label: 'Homecoming & Gala' },
              { id: 'heritage', label: 'Heritage Archives' }
            ].map((cat) => {
              const count =
                cat.id === 'all'
                  ? galleryItems.length
                  : galleryItems.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-stone-400">
            {filteredItems.length} {filteredItems.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 bg-stone-50 rounded-xl border border-dashed border-stone-300">
            <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-stone-700">No photos in this collection yet</p>
            <p className="text-xs text-stone-400 mt-1">
              {canUpload
                ? 'As an Administrator or Registrar, click "Upload Photo" above to contribute archival imagery.'
                : 'Archival photos will appear here once uploaded by the Administrator or Registrar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl overflow-hidden border border-stone-200 bg-white hover:border-stone-300 hover:shadow-md transition-all flex flex-col"
              >
                <div
                  className="relative h-48 w-full overflow-hidden bg-stone-100 cursor-pointer"
                  onClick={() => setInspectingItem(item)}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Archival Details
                    </span>
                  </div>

                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-[#991B1B]/80 backdrop-blur-xs">
                      {item.year}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col justify-between flex-1">
                  <div>
                    <h4
                      onClick={() => setInspectingItem(item)}
                      className="text-xs font-bold text-stone-900 line-clamp-1 hover:text-[#991B1B] cursor-pointer"
                    >
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Shield className="w-3 h-3 text-[#991B1B]" />
                      <span className="truncate">
                        By {item.uploadedByName || 'Institution'} ({item.uploaderRole || 'admin'})
                      </span>
                    </div>

                    {canUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete photo (Admin/Registrar)"
                        aria-label="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            <span>Preserving St. Cecilia's legacy across generations.</span>
            {!canUpload && (
              <span className="block sm:inline sm:ml-2 text-stone-400">
                (Upload access restricted to Admin and Registrar)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Gallery
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-MODAL: UPLOAD ARCHIVAL PHOTO (Admin & Registrar Only)
          ======================================================== */}
      {showUploadModal && canUpload && (
        <div
          className="fixed inset-0 z-[110] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 text-[#8B181B] rounded-xl border border-red-100">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Upload to Campus & Heritage Gallery</h4>
                  <p className="text-[11px] text-stone-500">
                    Authorized as <strong className="text-[#8B181B] uppercase">{currentUser?.role}</strong> ({currentUser?.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Close upload modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* One-Click Presets for Easy Demo/Testing */}
            <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
                <span className="flex items-center gap-1 text-[11px] text-stone-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Quick Fill Archival Samples:
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="p-2 text-left bg-white border border-stone-200 hover:border-[#8B181B] rounded-lg transition-colors truncate cursor-pointer"
                  >
                    <div className="font-semibold text-stone-900 text-[11px] truncate">{p.title}</div>
                    <div className="text-[10px] text-stone-500 uppercase">{p.category} • {p.year}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., St. Cecilia Quadrangle Dedication"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#8B181B] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium text-stone-800 focus:outline-hidden focus:border-[#8B181B]"
                  >
                    <option value="campus">Campus & Facilities</option>
                    <option value="commencement">Commencement & Honors</option>
                    <option value="homecoming">Homecoming & Gala</option>
                    <option value="heritage">Heritage Archives</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Year / Batch / Era *
                  </label>
                  <input
                    type="text"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    placeholder="e.g. 2026 or 1998 Founding"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#8B181B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Image Source (Web URL or Upload) *
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl mb-2 focus:outline-hidden focus:border-[#8B181B]"
                />

                <div className="flex items-center gap-2">
                  <label className="flex-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 border border-dashed border-stone-300 rounded-xl cursor-pointer text-center text-stone-600 font-medium transition-colors">
                    <span className="truncate">Choose Local File (PNG / JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preview */}
              {newUrl && (
                <div className="p-2 border border-stone-200 rounded-xl bg-stone-50">
                  <p className="text-[10px] font-bold text-stone-500 uppercase mb-1">Preview:</p>
                  <img
                    src={newUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={() => setUploadError('Image preview failed. Please check the URL.')}
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Historical Description / Archival Notes
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Notes on alumni honors, architectural heritage, ceremony details, or historical context..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl resize-none focus:outline-hidden focus:border-[#8B181B]"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish to Gallery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL: INSPECT ITEM / FULL ARCHIVAL DETAILS
          ======================================================== */}
      {inspectingItem && (
        <div
          className="fixed inset-0 z-[110] bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setInspectingItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 my-auto overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8B181B] tracking-wider">
                  {inspectingItem.category} • {inspectingItem.year}
                </span>
                <h4 className="text-base font-bold text-stone-900">{inspectingItem.title}</h4>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 cursor-pointer"
                aria-label="Close photo preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-stone-200 mb-4 bg-black max-h-[60vh]">
              <img
                src={inspectingItem.url}
                alt={inspectingItem.title}
                className="w-full h-auto max-h-[55vh] object-contain mx-auto"
              />
            </div>

            {inspectingItem.description && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 mb-3">
                <p className="font-semibold text-stone-900 mb-0.5">Archival Description:</p>
                <p>{inspectingItem.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#8B181B]" />
                <span>
                  Archived by: <strong className="text-stone-800">{inspectingItem.uploadedByName || 'Institution'}</strong> ({inspectingItem.uploaderRole || 'admin'})
                </span>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-MODAL: DELETE CONFIRMATION
          ======================================================== */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-[120] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900">Remove Photo?</h4>
                <p className="text-xs text-stone-500 line-clamp-1">{itemToDelete.title}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove this photograph from the archival gallery? This action is recorded in the institutional logs.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGalleryItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
