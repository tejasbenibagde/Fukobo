// src/App.tsx

import Workspace from "@/components/layout/workspace/workspace";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DrawingProvider } from "@/context/drawing-context";

export default function App() {
  return (
    <div className="relative h-screen w-screen">
      <DrawingProvider>
        <SidebarProvider>
          <Workspace />
        </SidebarProvider>
      </DrawingProvider>
    </div>
  );
}
