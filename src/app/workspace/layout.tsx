import { HydrationHelper } from "@/components/layout/hydration-helper";
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <HydrationHelper />
      <SidebarWrapper />
      <main id="main-content" className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">{children}</ScrollArea>
      </main>
    </div>
  );
}
