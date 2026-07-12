import { Button } from "@/components/ui/button";
import { PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export function CollapseButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
    >
      <PanelLeftClose className="size-4" />
    </Button>
  );
}