// src/App.tsx

import Workspace from "@/components/layout/workspace/workspace";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function App() {
  return (
    <div className="relative h-screen w-screen">
      <SidebarProvider>
        <Workspace />
      </SidebarProvider>
    </div>
  );
}