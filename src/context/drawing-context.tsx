/* eslint-disable @typescript-eslint/no-explicit-any */
// src/context/drawing-context.tsx
import { createContext, useContext, useState, useRef, ReactNode } from "react";
import { Canvas } from "fuderu";
import { ToolType, Layer, DrawingContextType, Artwork, ReplayAction } from "../types";

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

const initialArtworks: Artwork[] = [
  {
    id: "art-sample-1",
    name: "Golden Sun Sketch",
    width: 800,
    height: 600,
    updatedAt: new Date().toISOString(),
    thumbnail: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='100%' height='100%' fill='%23fafaf9'/><circle cx='400' cy='300' r='120' fill='%23f97316' opacity='0.45'/><path d='M100 520 Q 400 350, 700 520' stroke='%233b82f6' stroke-width='16' fill='none' stroke-linecap='round'/></svg>",
    document: {
      version: 1,
      width: 800,
      height: 600,
      layers: [
        {
          id: "layer-sun-bg",
          name: "Background",
          visible: true,
          opacity: 1,
          blendMode: "source-over",
          alphaLock: false,
          locked: false,
          dataUrl: ""
        }
      ],
      activeLayerId: "layer-sun-bg"
    },
    layers: [
      {
        id: "layer-sun-bg",
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
    document: {
      version: 1,
      width: 800,
      height: 600,
      layers: [
        {
          id: "layer-waves-bg",
          name: "Background",
          visible: true,
          opacity: 1,
          blendMode: "source-over",
          alphaLock: false,
          locked: false,
          dataUrl: ""
        }
      ],
      activeLayerId: "layer-waves-bg"
    },
    layers: [
      {
        id: "layer-waves-bg",
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

  // Replay Stack state
  const [replayStack, setReplayStack] = useState<ReplayAction[]>([]);

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
      alphaLock: l.alphaLock ?? false,
      locked: l.locked ?? false,
    }));
    
    // We reverse layers so that "Background" layer (first in fuderu) is at the bottom of the list,
    // and new layers (top-most) are at the top of the layer list UI.
    setLayers([...mapped].reverse());
    const active = canvas.getActiveLayer?.() || canvas.getLayerById?.(canvas.layers?.getActiveId?.() || "");
    setActiveLayerId(active?.id || canvas.layers?.getActiveId() || "");
    
    setCanUndo(canvas.history ? canvas.history.canUndo() : false);
    setCanRedo(canvas.history ? canvas.history.canRedo() : false);
  };

  const saveCurrentArtwork = async () => {
    if (!fuderuCanvasRef.current || !currentArtworkId) return;
    const canvasInstance = fuderuCanvasRef.current;
    
    let doc: any = undefined;
    let thumbnail = "";
    try {
      doc = await canvasInstance.exportDocument();
      thumbnail = await canvasInstance.exportPNG({ includeBackground: true });
    } catch {
      const canvasElement = document.querySelector('canvas');
      thumbnail = canvasElement ? canvasElement.toDataURL("image/png") : "";
    }
    
    const actionLog = typeof canvasInstance.getActionLog === "function" ? canvasInstance.getActionLog() : [];
    
    const updatedArtworks = artworks.map((art) => {
      if (art.id === currentArtworkId) {
        return {
          ...art,
          name: canvasName,
          width: canvasWidth,
          height: canvasHeight,
          thumbnail: thumbnail || art.thumbnail,
          document: doc,
          actionLog,
          updatedAt: new Date().toISOString()
        };
      }
      return art;
    });
    
    setArtworks(updatedArtworks);
    try {
      localStorage.setItem("fukobo_artworks", JSON.stringify(updatedArtworks));
    } catch (e) {
      console.warn("Storage warning:", e);
    }
  };

  const createNewArtwork = (name: string, width: number, height: number) => {
    const newId = "art-" + Date.now();
    const w = width || 800;
    const h = height || 600;
    const initialLayerId = "layer-bg-" + Date.now();
    const newArt: Artwork = {
      id: newId,
      name: name || "Untitled Artwork",
      width: w,
      height: h,
      updatedAt: new Date().toISOString(),
      thumbnail: "",
      document: {
        version: 1,
        width: w,
        height: h,
        layers: [
          {
            id: initialLayerId,
            name: "Background",
            visible: true,
            opacity: 1,
            blendMode: "source-over",
            alphaLock: false,
            locked: false,
            dataUrl: "",
          }
        ],
        activeLayerId: initialLayerId,
      },
      layers: [
        {
          id: initialLayerId,
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
    try {
      localStorage.setItem("fukobo_artworks", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage warning:", e);
    }
    
    setCanvasWidth(w);
    setCanvasHeight(h);
    setCanvasName(name || "Untitled Artwork");
    setCurrentArtworkId(newId);
    setReplayStack([]);
    
    setLayers([
      { id: initialLayerId, name: "Background", visible: true, opacity: 1, blendMode: "source-over" }
    ]);
    setActiveLayerId(initialLayerId);
    
    setIsEditorActive(true);
  };

  const loadArtwork = (id: string) => {
    const art = artworks.find(a => a.id === id);
    if (!art) return;
    
    setCanvasWidth(art.width);
    setCanvasHeight(art.height);
    setCanvasName(art.name);
    setCurrentArtworkId(art.id);
    setReplayStack(art.actionLog || art.replayStack || []);
    
    if (art.document) {
      setLayers(art.document.layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        blendMode: l.blendMode,
        alphaLock: l.alphaLock ?? false,
        locked: l.locked ?? false
      })).reverse());
      if (art.document.activeLayerId) {
        setActiveLayerId(art.document.activeLayerId);
      }
    } else if (art.layers) {
      setLayers(art.layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        blendMode: l.blendMode,
        alphaLock: l.alphaLock ?? false,
        locked: l.locked ?? false
      })).reverse());
      
      if (art.layers.length > 0) {
        setActiveLayerId(art.layers[art.layers.length - 1].id);
      }
    }
    
    setIsEditorActive(true);
  };

  const deleteArtwork = (id: string) => {
    const updated = artworks.filter(a => a.id !== id);
    setArtworks(updated);
    try {
      localStorage.setItem("fukobo_artworks", JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage warning:", e);
    }
    if (currentArtworkId === id) {
      setCurrentArtworkId(null);
      setIsEditorActive(false);
    }
  };

  const addLayer = () => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    const count = canvas.getLayers().length + 1;
    canvas.createLayer({ name: `Layer ${count}` });
    syncLayers();
  };

  const deleteLayer = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    try {
      if (fuderuCanvasRef.current.getLayers().length > 1) {
        fuderuCanvasRef.current.deleteLayer(id);
        syncLayers();
      }
    } catch (e) {
      console.warn("deleteLayer warning:", e);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    try {
      const layer = canvas.getLayers().find(l => l.id === id);
      if (layer) {
        canvas.updateLayer(id, { visible: !layer.visible });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleAlphaLock = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    try {
      const layer = canvas.getLayers().find(l => l.id === id);
      if (layer) {
        canvas.updateLayer(id, { alphaLock: !layer.alphaLock });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleLayerLock = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    const canvas = fuderuCanvasRef.current;
    try {
      const layer = canvas.getLayers().find(l => l.id === id);
      if (layer) {
        canvas.updateLayer(id, { locked: !layer.locked });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    if (!fuderuCanvasRef.current) return;
    try {
      const exists = fuderuCanvasRef.current.getLayers().some(l => l.id === id);
      if (exists) {
        fuderuCanvasRef.current.updateLayer(id, { opacity });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const setLayerBlendMode = (id: string, blendMode: string) => {
    if (!fuderuCanvasRef.current) return;
    try {
      const exists = fuderuCanvasRef.current.getLayers().some(l => l.id === id);
      if (exists) {
        fuderuCanvasRef.current.updateLayer(id, { blendMode: blendMode as any });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const renameLayer = (id: string, name: string) => {
    if (!fuderuCanvasRef.current) return;
    try {
      const exists = fuderuCanvasRef.current.getLayers().some(l => l.id === id);
      if (exists) {
        fuderuCanvasRef.current.updateLayer(id, { name });
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSetActiveLayerId = (id: string) => {
    if (!fuderuCanvasRef.current) return;
    try {
      const exists = fuderuCanvasRef.current.getLayers().some(l => l.id === id);
      if (exists) {
        fuderuCanvasRef.current.setActiveLayer(id);
        setActiveLayerId(id);
        syncLayers();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const reorderLayers = (newLayers: Layer[]) => {
    if (!fuderuCanvasRef.current) return;
    try {
      const canvas = fuderuCanvasRef.current;
      const targetIds = [...newLayers].reverse().map(l => l.id);
      canvas.reorderLayers(targetIds);
      syncLayers();
    } catch (e) {
      console.warn(e);
    }
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
      fuderuCanvasRef.current.renderLayers();
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
        toggleAlphaLock,
        toggleLayerLock,
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
        replayStack,
        setReplayStack,
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
