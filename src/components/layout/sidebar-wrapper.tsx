"use client";

import dynamic from "next/dynamic";

const SidebarDynamic = dynamic(() => import("./sidebar").then((m) => m.Sidebar), { ssr: false });

export function SidebarWrapper() {
  return <SidebarDynamic />;
}
