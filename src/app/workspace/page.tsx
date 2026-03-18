"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Editor } from "@/components/editor/editor";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function WorkspacePage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Editor />
        </ScrollArea>
      </main>
    </div>
  );
}
