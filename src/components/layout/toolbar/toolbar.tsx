// src/components/layout/toolbar/toolbar.tsx

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDrawing } from "@/context/drawing-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  Undo2, 
  Redo2, 
  Download, 
  PanelRight, 
  Paintbrush, 
  Sparkles,
  Home,
  Save
} from "lucide-react";

export default function Toolbar() {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    rightPanelOpen, 
    setRightPanelOpen,
    activeTool,
    setIsEditorActive,
    saveCurrentArtwork,
    canvasName
  } = useDrawing();

  const getToolDisplayName = (tool: string) => {
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  };

  const handleSave = () => {
    saveCurrentArtwork();
    const statusEl = document.querySelector('footer');
    if (statusEl) {
      statusEl.innerText = `Successfully saved "${canvasName}"!`;
      setTimeout(() => {
        statusEl.innerText = "Ready";
      }, 2500);
    }
  };

  return (
    <TooltipProvider delay={200}>
      <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        {/* Left Section: Sidebar toggle, Title & Return to Gallery */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9 border hover:bg-accent hover:text-accent-foreground transition-all duration-200" />
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          
          <div className="flex items-center gap-4">
            <span className="font-sans font-bold tracking-tight text-foreground flex items-center gap-1.5 select-none">
              <span className="p-1 rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              FuKōbō <span className="text-muted-foreground font-medium text-sm hidden md:inline">Studio</span>
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                saveCurrentArtwork();
                setIsEditorActive(false);
              }}
              className="h-8 text-xs font-semibold gap-1.5 hover:bg-stone-100 hover:text-stone-900 text-stone-600 transition-all border border-stone-200"
              title="Save & return to gallery"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Gallery Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Center Section: Core Actions (Undo, Redo, Save, Export) */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground"
                onClick={undo}
                disabled={!canUndo}
              />
            }>
              <Undo2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Undo (Ctrl+Z)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground"
                onClick={redo}
                disabled={!canRedo}
              />
            }>
              <Redo2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Redo (Ctrl+Y)
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Explicit Save Button */}
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-primary/15 hover:text-primary"
                onClick={handleSave}
              />
            }>
              <Save className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Save Artwork
            </TooltipContent>
          </Tooltip>

          {/* Export PNG Button */}
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-foreground hover:bg-primary/15 hover:text-primary"
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const url = canvas.toDataURL("image/png");
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${canvasName || "artwork"}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    const statusEl = document.querySelector('footer');
                    if (statusEl) {
                      statusEl.innerText = "Artwork successfully exported as PNG!";
                      setTimeout(() => {
                        statusEl.innerText = "Ready";
                      }, 2000);
                    }
                  }
                }}
              />
            }>
              <Download className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Export Artwork (PNG)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section: Active Tool status & Inspector toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/40 px-2.5 py-1 rounded-full border border-border/50">
            <Paintbrush className="h-3 w-3" />
            <span>Tool: <strong className="text-foreground">{getToolDisplayName(activeTool)}</strong></span>
          </div>

          <div className="h-4 w-[1px] bg-border hidden sm:block" />

          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 transition-colors ${
                  rightPanelOpen 
                    ? "bg-accent text-accent-foreground border-accent" 
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              />
            }>
              <PanelRight className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {rightPanelOpen ? "Hide Inspector" : "Show Inspector"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
