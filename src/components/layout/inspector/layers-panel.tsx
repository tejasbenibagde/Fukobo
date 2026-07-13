// src/components/layout/inspector/layers-panel.tsx

import { useDrawing } from "@/context/drawing-context";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff
} from "lucide-react";

export default function LayersPanel() {
  const {
    layers,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    setLayerOpacity
  } = useDrawing();

  return (
    <section className="flex flex-col h-1/3 min-h-[160px] max-h-[300px] p-4 bg-background">
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
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`flex items-center justify-between p-2 rounded-md border transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary/5 border-primary shadow-2xs"
                  : "hover:bg-accent/50 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* Left Side: Visibility & Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>
                <span className={`text-xs truncate font-medium ${isActive ? "text-foreground font-semibold" : "text-foreground/80"}`}>
                  {layer.name}
                </span>
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

      {/* Active Layer Opacity Adjuster */}
      <div className="pt-3 border-t mt-3 space-y-1">
        {layers.map((layer) => {
          if (layer.id !== activeLayerId) return null;
          return (
            <div key={layer.id} className="space-y-1.5">
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
          );
        })}
      </div>
    </section>
  );
}
