// src/types.ts

import { MutableRefObject } from "react";
import { Canvas } from "fuderu";

export type ToolType = 'brush' | 'pencil' | 'eraser' | 'bucket' | 'picker' | 'rectangle' | 'circle' | 'text';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0 to 1
  blendMode: string;
}

export interface ArtworkLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: string;
  dataUrl: string; // Base64 png data of the layer
}

export interface ReplayAction {
  id: string;
  type: 'stroke' | 'clear' | 'addLayer' | 'deleteLayer' | 'renameLayer' | 'setLayerOpacity' | 'setLayerBlendMode' | 'reorderLayers' | 'bucket' | 'shape' | 'text';
  timestamp: number;
  data: {
    points?: { x: number; y: number; pressure: number }[];
    tool?: string;
    size?: number;
    opacity?: number;
    color?: string;
    layerId?: string;
    layerName?: string;
    blendMode?: string;
    index?: number;
    targetIds?: string[];
    shapeType?: string;
    startPoint?: { x: number; y: number };
    endPoint?: { x: number; y: number };
    strokeType?: string;
    fillShape?: boolean;
    text?: string;
    fontFamily?: string;
    isBold?: boolean;
    isItalic?: boolean;
    textAlign?: string;
    visible?: boolean;
  };
}

export interface Artwork {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: string;
  thumbnail: string; // Base64 png thumbnail
  layers: ArtworkLayer[];
  replayStack?: ReplayAction[];
}

export interface DrawingContextType {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  
  // Dashboard & Artworks management
  isEditorActive: boolean;
  setIsEditorActive: (active: boolean) => void;
  artworks: Artwork[];
  currentArtworkId: string | null;
  setCurrentArtworkId: (id: string | null) => void;
  canvasWidth: number;
  setCanvasWidth: (w: number) => void;
  canvasHeight: number;
  setCanvasHeight: (h: number) => void;
  canvasName: string;
  setCanvasName: (name: string) => void;
  saveCurrentArtwork: () => void;
  loadArtwork: (id: string) => void;
  createNewArtwork: (name: string, width: number, height: number) => void;
  deleteArtwork: (id: string) => void;

  // fuderu canvas reference
  fuderuCanvasRef: MutableRefObject<Canvas | null>;
  syncLayers: () => void;
  
  // Layers State
  layers: Layer[];
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setLayerBlendMode: (id: string, blendMode: string) => void;
  renameLayer: (id: string, name: string) => void;
  reorderLayers: (layers: Layer[]) => void;
  clearCanvas: () => void;
  
  // History State
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Panels
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;

  // Text & Shape Tool Settings
  fontFamily: string;
  setFontFamily: (font: string) => void;
  isBold: boolean;
  setIsBold: (bold: boolean) => void;
  isItalic: boolean;
  setIsItalic: (italic: boolean) => void;
  textAlign: string;
  setTextAlign: (align: string) => void;
  strokeType: string;
  setStrokeType: (stroke: string) => void;
  fillShape: boolean;
  setFillShape: (fill: boolean) => void;
  pressureSensitivityEnabled: boolean;
  setPressureSensitivityEnabled: (enabled: boolean) => void;

  // Replay Stack State
  replayStack: ReplayAction[];
  setReplayStack: React.Dispatch<React.SetStateAction<ReplayAction[]>>;
}

