/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/drawing-context.tsx
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Canvas } from "fuderu";
import { ToolType, Layer, DrawingContextType, Artwork, ArtworkLayer } from "../types";

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

const initialArtworks: Artwork[] = [
  {
    id: "art-sample-1",
    name: "Golden Sun Sketch",
    width: 800,
    height: 600,
    updatedAt: new Date().toISOString(),
    thumbnail: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23fafaf9'/><circle cx='400' cy='300' r='120' fill='%23f97316' opacity='0.45'/><path d='M100 520 Q 400 350, 700 520' stroke='%233b82f6' stroke-width='16' fill='none' stroke-linecap='round'/></svg>",
    layers: [
      {
        id: "layer-1",
        name: "Background",
        visible: true,
        opacity: 1,
        blendMode: "source-over",
        dataUrl: ""
      }
    ]
  },
  {
    id: "art-sample-2",
    name: "Calm Waves",
    width: 800,
    height: 600,
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    thumbnail: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23f5f5f4'/><path d='M100 400 C 250 300, 350 500, 700 400' stroke='%2306b6d4' stroke-width='14' fill='none' stroke-linecap='round'/><path d='M100 460 C 250 360, 350 560, 700 460' stroke='%2306b6d4' stroke-width='8' fill='none' stroke-linecap='round' opacity='0.5'/></svg>",
    layers: [
      {
        id: "layer-1",
        name: "Background",
        visible: true,
        opacity: 1,
        blendMode: "source-over",
        dataUrl: ""
      }
    ]
  }
];

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

  // Dashboard & Artworks management state
  const [isEditorActive, setIsEditorActive] = useState<boolean>(false);
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    const saved = localStorage.getItem("fukobo_artworks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialArtworks;
      }
    }
    return initialArtworks;
  });
  const [currentArtworkId, setCurrentArtworkId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(800);
  const [canvasHeight, setCanvasHeight] = useState<number>(600);
  const [canvasName, setCanvasName] = useState<string>("Untitled Canvas");

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
    
    setCanUndo(canvas.history.canUndo());
    setCanRedo(canvas.history.canRedo());
  };

  const saveCurrentArtwork = () => {
    if (!fuderuCanvasRef.current || !currentArtworkId) return;
    const canvasInstance = fuderuCanvasRef.current;
    
    const canvasElement = document.querySelector('canvas');
    const thumbnail = canvasElement ? canvasElement.toDataURL("image/png") : "";
    
    const fLayers = canvasInstance.getLayers();
    const artworkLayers: ArtworkLayer[] = fLayers.map((l: any) => {
      return {
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        blendMode: l.blendMode,
        dataUrl: l.canvas ? l.canvas.toDataURL("image/png") : ""
      };
    });
    
    const updatedArtworks = artworks.map((art) => {
      if (art.id === currentArtworkId) {
        return {
          ...art,
          name: canvasName,
          width: canvasWidth,
          height: canvasHeight,
          thumbnail,
          layers: artworkLayers,
          updatedAt: new Date().toISOString()
        };
      }
      return art;
    });
    
    setArtworks(updatedArtworks);
    localStorage.setItem("fukobo_artworks", JSON.stringify(updatedArtworks));
  };

  const createNewArtwork = (name: string, width: number, height: number) => {
    const newId = "art-" + Date.now();
    const newArt: Artwork = {
      id: newId,
      name: name || "Untitled Artwork",
      width: width || 800,
      height: height || 600,
      updatedAt: new Date().toISOString(),
      thumbnail: "",
      layers: [
        {
          id: "layer-1",
          name: "Background",
          visible: true,
          opacity: 1,
          blendMode: "source-over",
          dataUrl: ""
        }
      ]
    };
    
    const updated = [newArt, ...artworks];
    setArtworks(updated);
    localStorage.setItem("fukobo_artworks", JSON.stringify(updated));
    
    setCanvasWidth(width || 800);
    setCanvasHeight(height || 600);
    setCanvasName(name || "Untitled Artwork");
    setCurrentArtworkId(newId);
    
    setLayers([
      { id: "layer-1", name: "Background", visible: true, opacity: 1, blendMode: "source-over" }
    ]);
    setActiveLayerId("layer-1");
    
    setIsEditorActive(true);
  };

  const loadArtwork = (id: string) => {
    const art = artworks.find(a => a.id === id);
    if (!art) return;
    
    setCanvasWidth(art.width);
    setCanvasHeight(art.height);
    setCanvasName(art.name);
    setCurrentArtworkId(art.id);
    
    setLayers(art.layers.map(l => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      blendMode: l.blendMode
    })));
    
    if (art.layers.length > 0) {
      setActiveLayerId(art.layers[art.layers.length - 1].id);
    }
    
    setIsEditorActive(true);
  };

  const deleteArtwork = (id: string) => {
    const updated = artworks.filter(a => a.id !== id);
    setArtworks(updated);
    localStorage.setItem("fukobo_artworks", JSON.stringify(updated));
    if (currentArtworkId === id) {
      setCurrentArtworkId(null);
      setIsEditorActive(false);
    }
  };

  const addLayer = () => {
    if (!fuderuCanvasRef.current) return;
    const count = layers.length + 1;
    fuderuCanvasRef.current.createLayer({ name: `Layer ${count}` });
    syncLayers();
  };

  const deleteLayer = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    fuderuCanvasRef.current.deleteLayer(id);
    syncLayers();
  };

  const toggleLayerVisibility = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    const layer = fuderuCanvasRef.current.getLayer(id);
    if (layer) {
      fuderuCanvasRef.current.updateLayer(id, { visible: !layer.visible });
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
    
    const targetIds = [...newLayers].reverse().map(l => l.id);
    
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
        isEditorActive,
        setIsEditorActive,
        artworks,
        currentArtworkId,
        setCurrentArtworkId,
        canvasWidth,
        setCanvasWidth,
        canvasHeight,
        setCanvasHeight,
        canvasName,
        setCanvasName,
        saveCurrentArtwork,
        loadArtwork,
        createNewArtwork,
        deleteArtwork,
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
