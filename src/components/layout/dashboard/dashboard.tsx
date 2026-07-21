// src/components/layout/dashboard/dashboard.tsx

import { useState } from "react";
import { useDrawing } from "@/context/drawing-context";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Sparkles, 
  FolderHeart,
  Clock,
  Layout,
  Maximize2,
  Trash
} from "lucide-react";

export default function Dashboard() {
  const { 
    artworks, 
    createNewArtwork, 
    loadArtwork, 
    deleteArtwork 
  } = useDrawing();

  // Create Canvas Form States
  const [showCreator, setShowCreator] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dimensionPresets = [
    { label: "Standard (800 × 600)", w: 800, h: 600, desc: "Classic SD proportion" },
    { label: "HD Landscape (1280 × 720)", w: 1280, h: 720, desc: "Modern widescreen proportion" },
    { label: "Square Studio (800 × 800)", w: 800, h: 800, desc: "Perfect for avatars/social media" },
    { label: "Portrait Sketch (600 × 800)", w: 600, h: 800, desc: "Great for vertical illustrations" },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedW = Math.max(300, Math.min(1920, width));
    const clampedH = Math.max(300, Math.min(1080, height));
    createNewArtwork(newCanvasName.trim() || "Untitled Artwork", clampedW, clampedH);
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-orange-200">
      {/* Top Professional Accent Bar */}
      <div className="h-1.5 w-full bg-primary" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto px-6 py-12 flex-1 flex flex-col gap-10">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <h1 className="text-3xl font-bold tracking-tight font-sans text-stone-900">
                FuKōbō <span className="font-light text-stone-500">Studio</span>
              </h1>
            </div>
            <p className="text-sm text-stone-500 max-w-lg leading-relaxed">
              A professional minimalist layered painting studio. Design pixel-perfect canvases, customize layers, and export high-fidelity artworks.
            </p>
          </div>

          <Button 
            onClick={() => {
              setNewCanvasName("");
              setWidth(800);
              setHeight(600);
              setShowCreator(true);
            }}
            className="h-11 px-5 gap-2 shadow-md hover:shadow-lg transition-all text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Create New Canvas
          </Button>
        </header>

        {/* Creator Modal/Overlay panel */}
        {showCreator && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-stone-900">Configure Your Canvas</h2>
                </div>
                <button 
                  onClick={() => setShowCreator(false)}
                  className="text-stone-400 hover:text-stone-600 font-mono text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                    Artwork Name
                  </label>
                  <input
                    type="text"
                    placeholder="E.g. Evening Landscape Sketch..."
                    value={newCanvasName}
                    onChange={(e) => setNewCanvasName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-stone-800"
                    autoFocus
                  />
                </div>

                {/* Dimensions Configuration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Width (pixels)
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="1920"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 300)}
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono font-bold text-stone-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                      Height (pixels)
                    </label>
                    <input
                      type="number"
                      min="300"
                      max="1080"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 300)}
                      className="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono font-bold text-stone-800"
                    />
                  </div>
                </div>

                {/* Quick Presets Selector */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                    Presets Quick Select
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dimensionPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setWidth(preset.w);
                          setHeight(preset.h);
                        }}
                        className={`p-3 text-left rounded-lg border transition-all text-xs flex flex-col gap-0.5 ${
                          width === preset.w && height === preset.h
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
                        }`}
                      >
                        <strong className="text-stone-800 font-semibold">{preset.label}</strong>
                        <span className="text-[10px] text-stone-400">{preset.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreator(false)}
                    className="h-10 text-stone-500 hover:text-stone-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 px-6 font-semibold"
                  >
                    Start Painting
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2 font-sans">
              <FolderHeart className="h-4 w-4 text-primary" />
              Your Artwork Library ({artworks.length})
            </h2>
          </div>

          {artworks.length === 0 ? (
            /* Empty state */
            <div className="flex-1 min-h-[300px] border border-dashed border-stone-200 rounded-xl bg-white/50 flex flex-col items-center justify-center p-8 text-center gap-4">
              <div className="p-4 rounded-full bg-stone-100 text-stone-400">
                <Layout className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-bold text-stone-800 text-base">No saved paintings yet</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Configure custom dimensions and click "Create New Canvas" above to kick off your masterpiece!
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowCreator(true)}
                className="mt-2 text-xs font-semibold gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Start Your First Canvas
              </Button>
            </div>
          ) : (
            /* Artworks Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {artworks.map((art) => {
                const isConfirmingDelete = confirmDeleteId === art.id;

                return (
                  <div 
                    key={art.id}
                    className="group bg-white rounded-xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col overflow-hidden relative"
                  >
                    {/* Thumbnail Preview box */}
                    <div 
                      onClick={() => loadArtwork(art.id)}
                      className="h-44 bg-stone-100 relative overflow-hidden flex items-center justify-center border-b border-stone-100 cursor-pointer group-hover:opacity-95 transition-opacity"
                    >
                      {/* Grid background behind artwork */}
                      <div className="absolute inset-0 opacity-[0.02]" style={{
                        backgroundImage: 'radial-gradient(circle, #000 10%, transparent 11%)',
                        backgroundSize: '10px 10px'
                      }} />
                      
                      {art.thumbnail ? (
                        <img 
                          src={art.thumbnail} 
                          alt={art.name}
                          className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-xs text-stone-400 font-mono flex flex-col items-center gap-1.5">
                          <Layout className="h-6 w-6 stroke-1 text-stone-300" />
                          <span>Empty Canvas</span>
                        </div>
                      )}

                      {/* Dimensions Overlay Tag */}
                      <div className="absolute bottom-2.5 right-2.5 bg-stone-950/80 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-md tracking-wide">
                        {art.width} × {art.height}px
                      </div>
                    </div>

                    {/* Content / Info Card Bottom */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <h3 
                          onClick={() => loadArtwork(art.id)}
                          className="font-bold text-stone-800 text-sm truncate cursor-pointer hover:text-primary transition-colors font-sans"
                        >
                          {art.name}
                        </h3>
                        
                        <div className="flex items-center gap-3.5 text-[11px] text-stone-400 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-stone-400" />
                            {formatDate(art.updatedAt)}
                          </span>
                          <span>|</span>
                          <span className="font-mono text-stone-500 font-bold">
                            {art.layers ? art.layers.length : 1} Layer{art.layers?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between border-t border-stone-100 pt-3.5">
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-2 w-full justify-between">
                            <span className="text-[10px] text-red-500 font-semibold animate-pulse">
                              Delete this?
                            </span>
                            <div className="flex gap-1.5 shrink-0">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteArtwork(art.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 text-[10px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                              >
                                Yes
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md transition-colors"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadArtwork(art.id)}
                              className="h-8 text-xs font-semibold border-stone-200 hover:bg-stone-50 px-3 shrink-0"
                            >
                              Open Painting
                            </Button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(art.id);
                              }}
                              className="text-stone-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all shrink-0"
                              title="Delete Artwork"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Humble Footer */}
      <footer className="border-t border-stone-200/60 bg-stone-100/30 py-6 text-center text-xs text-stone-400 select-none">
        <div className="flex items-center justify-center gap-1 font-mono font-bold uppercase tracking-wider text-[10px]">
          <span>© {new Date().getFullYear()} FuKōbō Studio</span>
          <span>•</span>
          <span>Crafted Minimal Workspace</span>
        </div>
      </footer>
    </div>
  );
}
