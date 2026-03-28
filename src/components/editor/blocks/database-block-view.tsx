"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Database as DatabaseIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { TableView } from "@/components/database/table-view";
import { useDatabaseStore } from "@/stores/database-store";

export function DatabaseBlockView({ node, updateAttributes }: NodeViewProps) {
  const attrDbId = node.attrs.databaseId as string;

  const createDatabase = useDatabaseStore((s) => s.createDatabase);
  const updateDatabaseTitle = useDatabaseStore((s) => s.updateDatabaseTitle);

  // Track the resolved database ID locally so we don't depend on attr propagation timing
  const [resolvedId, setResolvedId] = useState(attrDbId || "");
  const createdRef = useRef(false);

  // Auto-create database if no ID yet — deferred to avoid flushSync conflict with Tiptap mount
  useEffect(() => {
    if (createdRef.current || resolvedId) return;
    createdRef.current = true;
    queueMicrotask(() => {
      const newId = createDatabase();
      setResolvedId(newId);
      updateAttributes({ databaseId: newId });
    });
  }, [resolvedId, createDatabase, updateAttributes]);

  // Keep resolvedId in sync with attr (for reloads when attr already has the ID)
  useEffect(() => {
    if (attrDbId && attrDbId !== resolvedId) {
      setResolvedId(attrDbId);
    }
  }, [attrDbId, resolvedId]);

  const database = useDatabaseStore((s) => (resolvedId ? s.databases[resolvedId] : undefined));

  const [titleVal, setTitleVal] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync title
  useEffect(() => {
    if (database) setTitleVal(database.title);
  }, [database?.title]);

  const commitTitle = useCallback(() => {
    if (resolvedId && titleVal.trim()) {
      updateDatabaseTitle(resolvedId, titleVal.trim());
    }
  }, [resolvedId, titleVal, updateDatabaseTitle]);

  if (!database) {
    return (
      <NodeViewWrapper>
        <div
          className="my-4 rounded-xl border border-border/30 bg-muted/10 p-8"
          data-testid="database-block-loading"
        >
          <div className="flex items-center gap-3 text-muted-foreground/40">
            <DatabaseIcon className="h-5 w-5" />
            <span className="text-sm">Loading database...</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        className="relative my-4 overflow-hidden rounded-xl border border-border/30 bg-background"
        data-testid="database-block"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          <DatabaseIcon className="h-4 w-4 text-muted-foreground/50" />
          <input
            ref={titleRef}
            type="text"
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitTitle();
                titleRef.current?.blur();
              }
            }}
            data-testid="database-title"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground/30"
            placeholder="Untitled Database"
          />
        </div>

        {/* Table */}
        <TableView database={database} />
      </div>
    </NodeViewWrapper>
  );
}
