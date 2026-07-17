/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/drawing-context.tsx
import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { Canvas } from "fuderu";
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

  // Text & Shape Tool Settings
  const [fontFamily, setFontFamily] = useState<string>("Montserrat");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<string>("center");
  const [strokeType, setStrokeType] = useState<string>("solid");
  const [fillShape, setFillShape] = useState<boolean>(false);
  const [pressureSensitivityEnabled, setPressureSensitivityEnabled] = useState<boolean>(false);

  // fuderu canvas reference
  const fuderuCanvasRef = useRef<Canvas | null>(null);

  // Layers state
  const [layers, setLayers] = useState<Layer[]>([
    { id: "layer-1", name: "Background", visible: true, opacity: 1, blendMode: "source-over" },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>("layer-1");

  // History states
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Synchronize layers from fuderu canvas to React state
  const syncLayers = () => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    
    const fLayers = canvas.getLayers();
    const mapped: Layer[] = fLayers.map((l: any) => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      blendMode: l.blendMode,
    }));
    
    // We reverse layers so that "Background" layer (first in fuderu) is at the bottom of the list,
    // and new layers (top-most) are at the top of the layer list UI.
    setLayers([...mapped].reverse());
    setActiveLayerId(canvas.layers.getActiveId() || "");
    
    if (canvas.history) {
      setCanUndo(canvas.history.canUndo());
      setCanRedo(canvas.history.canRedo());
    }
  };

  // Sync brush properties with fuderu whenever they change
  useEffect(() => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    
    canvas.pressureSimulation = pressureSensitivityEnabled;

    canvas.loadConfig({
      size: brushSize,
      opacity: brushOpacity,
      color: primaryColor,
      eraser: activeTool === 'eraser',
    });
    canvas.setEraser(activeTool === 'eraser');
    
    // Pencil tool configures smoother but shorter spacing or sharp non-smoothed drawing
    if (activeTool === 'pencil') {
      canvas.setSmooth(false);
      canvas.loadConfig({ spacing: 0.05 });
    } else {
      canvas.setSmooth(true);
      canvas.loadConfig({ spacing: 0.12 });
    }
  }, [brushSize, brushOpacity, primaryColor, activeTool, pressureSensitivityEnabled]);

  const addLayer = () => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    const num = canvas.getLayers().length;
    canvas.createLayer({ name: `Layer ${num}` });
    syncLayers();
  };

  const deleteLayer = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    try {
      fuderuCanvasRef.current.deleteLayer(id);
      syncLayers();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    const l = canvas.getLayers().find((x: any) => x.id === id);
    if (l) {
      canvas.updateLayer(id, { visible: !l.visible });
      syncLayers();
    }
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.updateLayer(id, { opacity });
    syncLayers();
  };

  const setLayerBlendMode = (id: string, blendMode: string) => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.updateLayer(id, { blendMode: blendMode as any });
    syncLayers();
  };

  const renameLayer = (id: string, name: string) => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.updateLayer(id, { name });
    syncLayers();
  };

  const handleSetActiveLayerId = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.setActiveLayer(id);
    setActiveLayerId(id);
  };

  const reorderLayers = (newLayers: Layer[]) => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    
    // In bottom-to-top order
    const targetIds = [...newLayers].reverse().map(l => l.id);
    
    // Move layers in the canvas to match targetIds order
    for (let i = 0; i < targetIds.length; i++) {
      const id = targetIds[i];
      canvas.layers.moveLayer(id, i);
    }
    
    canvas.renderLayers();
    syncLayers();
  };

  const undo = () => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.undo();
    syncLayers();
  };

  const redo = () => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.redo();
    syncLayers();
  };

  const clearCanvas = () => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.clear();
    // Fill background with white
    const bg = fuderuCanvasRef.current.getLayers()[0];
    if (bg) {
      bg.ctx.fillStyle = "#ffffff";
      bg.ctx.fillRect(0, 0, bg.canvas.width, bg.canvas.height);
      (fuderuCanvasRef.current as any).renderLayers();
    }
    syncLayers();
  };

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
        fuderuCanvasRef,
        syncLayers,
        layers,
        activeLayerId,
        setActiveLayerId: handleSetActiveLayerId,
        addLayer,
        deleteLayer,
        toggleLayerVisibility,
        setLayerOpacity,
        setLayerBlendMode,
        renameLayer,
        reorderLayers,
        clearCanvas,
        undo,
        redo,
        canUndo,
        canRedo,
        leftPanelOpen,
        setLeftPanelOpen,
        rightPanelOpen,
        setRightPanelOpen,
        fontFamily,
        setFontFamily,
        isBold,
        setIsBold,
        isItalic,
        setIsItalic,
        textAlign,
        setTextAlign,
        strokeType,
        setStrokeType,
        fillShape,
        setFillShape,
        pressureSensitivityEnabled,
        setPressureSensitivityEnabled,
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

