// src/context/drawing-context.tsx
import { createContext, useContext, useState, ReactNode } from "react";
import { ToolType, Layer, DrawingContextType } from "../types";

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export function DrawingProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushOpacity, setBrushOpacity] = useState<number>(1);
  const [primaryColor, setPrimaryColor] = useState<string>("#3b82f6"); // Default blue
  const [secondaryColor, setSecondaryColor] = useState<string>("#ffffff");

  // Panels
  const [leftPanelOpen, setLeftPanelOpen] = useState<boolean>(true);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);

  // Layers
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Background", visible: true, opacity: 1 },
    { id: "layer-2", name: "Layer 1", visible: true, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>("layer-2");

  // Simple history mockup for UI
  const [historyIndex, setHistoryIndex] = useState<number>(2);
  const maxHistory = 5;

  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newId,
      name: `Layer ${layers.length}`,
      visible: true,
      opacity: 1,
    };
    setLayers([newLayer, ...layers]);
    setActiveLayerId(newId);
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return; // Keep at least one
    const updated = layers.filter((l) => l.id !== id);
    setLayers(updated);
    if (activeLayerId === id) {
      setActiveLayerId(updated[0].id);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(
      layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers(
      layers.map((l) => (l.id === id ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l))
    );
  };

  const reorderLayers = (newLayers: Layer[]) => {
    setLayers(newLayers);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < maxHistory) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < maxHistory;

  return (
    <DrawingContext.Provider
      value={{
        activeTool,
        setActiveTool,
        brushSize,
        setBrushSize,
        brushOpacity,
        setBrushOpacity,
        primaryColor,
        setPrimaryColor,
        secondaryColor,
        setSecondaryColor,
        layers,
        activeLayerId,
        setActiveLayerId,
        addLayer,
        deleteLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        reorderLayers,
        undo,
        redo,
        canUndo,
        canRedo,
        leftPanelOpen,
        setLeftPanelOpen,
        rightPanelOpen,
        setRightPanelOpen,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
}

export function useDrawing() {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error("useDrawing must be used within a DrawingProvider");
  }
  return context;
}
