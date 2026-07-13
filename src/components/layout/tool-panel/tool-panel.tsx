// src/components/layout/tool-panel/tool-panel.tsx

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDrawing } from "@/context/drawing-context";
import { ToolType } from "@/types";
import {
  Paintbrush,
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Square,
  Circle,
  Type,
  ChevronLeft,
  ChevronRight,
  Palette,
  Sliders,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function ToolPanel() {
  const {
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
  } = useDrawing();

  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  // List of drawing tools
  const toolsList = [
    { id: "brush" as ToolType, label: "Brush", icon: Paintbrush },
    { id: "pencil" as ToolType, label: "Pencil", icon: Pencil },
    { id: "eraser" as ToolType, label: "Eraser", icon: Eraser },
    { id: "bucket" as ToolType, label: "Fill Bucket", icon: PaintBucket },
    { id: "picker" as ToolType, label: "Eyedropper", icon: Pipette },
    { id: "rectangle" as ToolType, label: "Rectangle", icon: Square },
    { id: "circle" as ToolType, label: "Circle", icon: Circle },
    { id: "text" as ToolType, label: "Text Tool", icon: Type },
  ];

  // Professional digital palette color presets
  const colorPresets = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#1e293b", // Slate Dark
    "#f1f5f9", // Slate Light
  ];

  const handleSwapColors = () => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  return (
    <Sidebar collapsible="icon" side="left" className="border-r transition-all duration-300">
      {/* Header with Collapse Trigger */}
      <SidebarHeader className="flex flex-row items-center justify-between px-3 py-2 border-b h-14">
        {isExpanded && (
         <span className="font-sans font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              FuKōbō <span className="text-muted-foreground font-medium text-sm hidden md:inline">Studio</span>
            </span>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2 gap-4">
        {/* Section 1: Painting Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground">
            {isExpanded ? "Drawing Tools" : "Tools"}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {toolsList.map((tool) => {
              const ToolIcon = tool.icon;
              const isActive = activeTool === tool.id;

              return (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    tooltip={tool.label}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90"
                        : "hover:bg-accent hover:text-accent-foreground text-foreground/80"
                    }`}
                  >
                    <ToolIcon className="h-4 w-4 shrink-0" />
                    {isExpanded && <span>{tool.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Section 2: Brush Properties (Sliders) - Only visible when expanded */}
        {isExpanded && (
          <SidebarGroup className="border-t pt-4 px-3 gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground pb-1">
              <Sliders className="h-3 w-3" />
              <span>Brush Settings</span>
            </div>

            {/* Brush Size */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-foreground/80 font-medium">
                <span>Brush Size</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-semibold">
                  {brushSize}px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Brush Opacity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-foreground/80 font-medium">
                <span>Opacity</span>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground font-semibold">
                  {Math.round(brushOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={brushOpacity * 100}
                onChange={(e) => setBrushOpacity(parseFloat(e.target.value) / 100)}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </SidebarGroup>
        )}

        {/* Section 3: Color Studio - Rich Picker + Presets */}
        {isExpanded && (
          <SidebarGroup className="border-t pt-4 px-3 gap-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pb-1">
              <div className="flex items-center gap-2">
                <Palette className="h-3 w-3" />
                <span>Color Studio</span>
              </div>
              <button
                onClick={handleSwapColors}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded hover:bg-accent"
                title="Swap Colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {/* Main and Secondary Swatch Well */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                {/* Secondary Swatch (Behind) */}
                <div 
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-md border shadow-sm cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                  style={{ backgroundColor: secondaryColor }}
                  title="Secondary Color"
                >
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  />
                </div>
                {/* Primary Swatch (Front) */}
                <div 
                  className="absolute top-0 left-0 w-8 h-8 rounded-md border-2 border-background shadow-md cursor-pointer hover:scale-105 transition-transform overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                  title="Primary Color"
                >
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="text-foreground/80 font-medium">Active Color</span>
                <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                  {primaryColor.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Quick Presets Grid */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {colorPresets.map((presetColor) => (
                <button
                  key={presetColor}
                  className={`w-6 h-6 rounded-md border border-border/80 cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-2xs ${
                    primaryColor === presetColor ? "ring-2 ring-primary ring-offset-1" : ""
                  }`}
                  style={{ backgroundColor: presetColor }}
                  onClick={() => setPrimaryColor(presetColor)}
                  title={presetColor}
                />
              ))}
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {isExpanded && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              System Online
            </span>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
