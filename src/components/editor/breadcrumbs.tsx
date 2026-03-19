"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { usePageStore } from "@/stores/page-store";

interface BreadcrumbsProps {
  pageId: string;
}

export function Breadcrumbs({ pageId }: BreadcrumbsProps) {
  const pages = usePageStore((state) => state.pages);

  const ancestors = useMemo(() => {
    const result: Array<{ id: string; title: string; icon: string }> = [];
    const visited = new Set<string>();
    let current = pages[pageId];
    while (current?.parentId && !visited.has(current.parentId)) {
      visited.add(current.parentId);
      const parent = pages[current.parentId];
      if (!parent) break;
      result.unshift({ id: parent.id, title: parent.title, icon: parent.icon });
      current = parent;
    }
    return result;
  }, [pages, pageId]);

  const currentPage = pages[pageId];

  if (ancestors.length === 0) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-center gap-0.5 px-16 pt-5 pb-0 select-none"
      aria-label="Page breadcrumb"
      data-testid="breadcrumbs"
    >
      {ancestors.map((ancestor) => (
        <Fragment key={ancestor.id}>
          <Link
            href={`/workspace/${ancestor.id}`}
            className="group flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12px] font-medium text-muted-foreground/45 hover:text-muted-foreground/80 hover:bg-muted/50 transition-all duration-150 min-w-0"
          >
            <span className="shrink-0 text-[11px] leading-none opacity-80 group-hover:opacity-100 transition-opacity">
              {ancestor.icon}
            </span>
            <span className="truncate max-w-[120px] tracking-[-0.01em]">
              {ancestor.title || "Untitled"}
            </span>
          </Link>

          {/* Typographic separator — more refined than a chevron icon */}
          <span
            className="shrink-0 text-[10px] font-light text-muted-foreground/20 px-0.5 leading-none"
            aria-hidden="true"
          >
            /
          </span>
        </Fragment>
      ))}

      {/* Current page — slightly more prominent, non-interactive */}
      <span className="flex items-center gap-1.5 px-1.5 py-1 text-[12px] font-medium text-muted-foreground/65 min-w-0 pointer-events-none">
        <span className="shrink-0 text-[11px] leading-none">{currentPage?.icon}</span>
        <span className="truncate max-w-[140px] tracking-[-0.01em]">
          {currentPage?.title || "Untitled"}
        </span>
      </span>
    </motion.nav>
  );
}
