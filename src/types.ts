// src/types.ts

export type ToolType = 'brush' | 'pencil' | 'eraser' | 'bucket' | 'picker' | 'rectangle' | 'circle' | 'text';

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    opacity: number; // 0 to 1
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

    // Layers State
    layers: Layer[];
    activeLayerId: string;
    setActiveLayerId: (id: string) => void;
    addLayer: () => void;
    deleteLayer: (id: string) => void;
    toggleLayerVisibility: (id: string) => void;
    setLayerOpacity: (id: string, opacity: number) => void;
    reorderLayers: (layers: Layer[]) => void;

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
}
