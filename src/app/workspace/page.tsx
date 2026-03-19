"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { usePageStore } from "@/stores/page-store";

export default function WorkspacePage() {
  const router = useRouter();
  const { getRootPageIds, createPage } = usePageStore();
  const hasHydrated = usePageStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    const rootIds = getRootPageIds();
    if (rootIds.length > 0) {
      router.replace(`/workspace/${rootIds[0]}`);
    } else {
      const id = createPage(null, "Getting Started", "👋");
      router.replace(`/workspace/${id}`);
    }
  }, [hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
