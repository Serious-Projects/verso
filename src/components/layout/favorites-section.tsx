"use client";

import { usePathname, useRouter } from "next/navigation";

import { usePageStore } from "@/stores/page-store";

export interface FavoritesSectionProps {
  favoritePageIds: string[];
}

export function FavoritesSection({ favoritePageIds }: FavoritesSectionProps) {
  if (favoritePageIds.length === 0) return null;

  return (
    <>
      <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Favorites
      </p>
      {favoritePageIds.map((id) => (
        <FavoriteItem key={id} pageId={id} />
      ))}
      <div className="my-2 mx-2 border-t border-sidebar-border/40" />
    </>
  );
}

function FavoriteItem({ pageId }: { pageId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const page = usePageStore((state) => state.pages[pageId]);
  const pages = usePageStore((state) => state.pages);

  const isActive = pathname === `/workspace/${pageId}`;

  // Build breadcrumb: parent title (if any)
  const parentTitle = page?.parentId ? (pages[page.parentId]?.title ?? null) : null;

  if (!page || page.isDeleted) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/workspace/${pageId}`)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && router.push(`/workspace/${pageId}`)}
      className={`group relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer select-none transition-all duration-150 ${
        isActive
          ? "bg-sidebar-accent/80 text-sidebar-foreground"
          : "hover:bg-muted/40 text-muted-foreground hover:text-sidebar-foreground"
      }`}
    >
      {isActive && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary pointer-events-none" />
      )}
      <span className="shrink-0 text-sm leading-none ml-0.5">{page.icon}</span>
      <span className="flex-1 truncate min-w-0">
        <span className="text-[13px] font-medium">{page.title || "Untitled"}</span>
        {parentTitle && (
          <span className="ml-1.5 text-[10px] text-muted-foreground/40">{parentTitle}</span>
        )}
      </span>
    </div>
  );
}
