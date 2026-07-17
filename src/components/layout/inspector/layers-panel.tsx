// src/components/layout/inspector/layers-panel.tsx

import { useState } from "react";
import { useDrawing } from "@/context/drawing-context";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  GripVertical
} from "lucide-react";

interface PanelProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function LayersPanel({ style, className }: PanelProps = {}) {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    setLayerOpacity,
    setLayerBlendMode,
    renameLayer,
    reorderLayers,
  } = useDrawing();

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const BLEND_MODES = [
    { id: "source-over", name: "Normal" },
    { id: "multiply", name: "Multiply" },
    { id: "screen", name: "Screen" },
    { id: "overlay", name: "Overlay" },
    { id: "darken", name: "Darken" },
    { id: "lighten", name: "Lighten" },
    { id: "color-dodge", name: "Color Dodge" },
    { id: "color-burn", name: "Color Burn" },
    { id: "hard-light", name: "Hard Light" },
    { id: "soft-light", name: "Soft Light" },
    { id: "difference", name: "Difference" },
  ];

  const getBlendModeName = (id: string) => {
    return BLEND_MODES.find((m) => m.id === id)?.name || "Normal";
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...layers];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    reorderLayers(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <section 
      style={style}
      className={`flex flex-col p-4 bg-background ${className || "h-full min-h-0"}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-sans font-semibold text-xs tracking-wider uppercase text-foreground">
            Layer Manager
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={addLayer}
          title="Add New Layer"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1 scrollbar-thin">
        {layers.map((layer, index) => {
          const isActive = layer.id === activeLayerId;
          const isDraggingThis = draggedIndex === index;
          const isDragOverThis = dragOverIndex === index;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              draggable={editingLayerId === null}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center justify-between p-2 rounded-md border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "hover:bg-accent/50 border-border/50 text-muted-foreground hover:text-foreground"
              } ${isDraggingThis ? "opacity-30 border-dashed" : ""} ${
                isDragOverThis ? "border-t-2 border-t-primary bg-primary/5 scale-[0.98]" : ""
              }`}
            >
              {/* Left Side: Drag Handle, Visibility, Name & Blend Mode stacked vertically */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div 
                  className="p-0.5 text-muted-foreground/30 hover:text-muted-foreground/80 cursor-grab active:cursor-grabbing shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
 
                <div className="flex flex-col min-w-0 flex-1 py-0.5">
                  {editingLayerId === layer.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editName.trim()) {
                            renameLayer(layer.id, editName.trim());
                          }
                          setEditingLayerId(null);
                        } else if (e.key === "Escape") {
                          setEditingLayerId(null);
                        }
                      }}
                      onBlur={() => {
                        if (editName.trim()) {
                          renameLayer(layer.id, editName.trim());
                        }
                        setEditingLayerId(null);
                      }}
                      autoFocus
                      className="text-xs bg-background border border-primary px-1.5 py-0.5 rounded focus:outline-none w-full max-w-[140px] text-foreground font-medium"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span 
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingLayerId(layer.id);
                          setEditName(layer.name);
                        }}
                        className={`text-xs truncate font-medium cursor-text select-none ${
                          isActive ? "text-foreground font-semibold" : "text-foreground/85"
                        }`}
                        title="Double click to rename"
                      >
                        {layer.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/75 font-medium">
                        Blend: {getBlendModeName(layer.blendMode)}
                      </span>
                    </>
                  )}
                </div>
              </div>
 
              {/* Right Side: Opacity Readout & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground/80 font-bold">
                  {Math.round(layer.opacity * 100)}%
                </span>
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete Layer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Layer Opacity & Blend Mode Adjuster */}
      <div className="pt-3 border-t mt-3 space-y-2.5">
        {layers.map((layer) => {
          if (layer.id !== activeLayerId) return null;
          return (
            <div key={layer.id} className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Active Layer Opacity</span>
                  <span>{Math.round(layer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity * 100}
                  onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value) / 100)}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Blend Mode</span>
                <select
                  value={layer.blendMode || "source-over"}
                  onChange={(e) => setLayerBlendMode(layer.id, e.target.value)}
                  className="w-full bg-background border rounded px-2 py-1 text-xs focus:outline-none"
                >
                  {BLEND_MODES.map((mode) => (
                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
