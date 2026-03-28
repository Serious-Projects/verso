"use client";

import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { Database as DatabaseIcon, Kanban, Table2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { BoardView } from "@/components/database/board-view";
import { TableView } from "@/components/database/table-view";
import { useDatabaseStore } from "@/stores/database-store";

export function DatabaseBlockView({ node, updateAttributes }: NodeViewProps) {
  const attrDbId = node.attrs.databaseId as string;

  const createDatabase = useDatabaseStore((s) => s.createDatabase);
  const updateDatabaseTitle = useDatabaseStore((s) => s.updateDatabaseTitle);
  const addView = useDatabaseStore((s) => s.addView);
  const setActiveView = useDatabaseStore((s) => s.setActiveView);

  const [resolvedId, setResolvedId] = useState(attrDbId || "");
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current || resolvedId) return;
    createdRef.current = true;
    queueMicrotask(() => {
      const newId = createDatabase();
      setResolvedId(newId);
      updateAttributes({ databaseId: newId });
    });
  }, [resolvedId, createDatabase, updateAttributes]);

  useEffect(() => {
    if (attrDbId && attrDbId !== resolvedId) {
      setResolvedId(attrDbId);
    }
  }, [attrDbId, resolvedId]);

  const database = useDatabaseStore((s) => (resolvedId ? s.databases[resolvedId] : undefined));

  const [titleVal, setTitleVal] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (database) setTitleVal(database.title);
  }, [database?.title]);

  const commitTitle = useCallback(() => {
    if (resolvedId && titleVal.trim()) {
      updateDatabaseTitle(resolvedId, titleVal.trim());
    }
  }, [resolvedId, titleVal, updateDatabaseTitle]);

  const handleSwitchView = useCallback(
    (type: "table" | "board") => {
      if (!database) return;
      const existing = database.views.find((v) => v.type === type);
      if (existing) {
        setActiveView(database.id, existing.id);
      } else {
        const name = type === "board" ? "Board view" : "Table view";
        addView(database.id, type, name);
      }
    },
    [database, setActiveView, addView],
  );

  if (!database) {
    return (
      <NodeViewWrapper>
        <div className="my-4 rounded-xl border border-border/30 bg-muted/10 p-8" data-testid="database-block-loading">
          <div className="flex items-center gap-3 text-muted-foreground/40">
            <DatabaseIcon className="h-5 w-5" />
            <span className="text-sm">Loading database...</span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  const activeView = database.views.find((v) => v.id === database.activeViewId) ?? database.views[0];
  const activeType = activeView?.type ?? "table";

  return (
    <NodeViewWrapper>
      <div
        className="relative my-4 overflow-hidden rounded-xl border border-border/30 bg-background"
        data-testid="database-block"
      >
        {/* Title bar + view switcher */}
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

          {/* View tabs */}
          <div className="flex items-center gap-0.5 rounded-lg border border-border/20 bg-muted/20 p-0.5">
            <button
              type="button"
              onClick={() => handleSwitchView("table")}
              data-testid="view-tab-table"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                activeType === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <Table2 className="h-3 w-3" />
              Table
            </button>
            <button
              type="button"
              onClick={() => handleSwitchView("board")}
              data-testid="view-tab-board"
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                activeType === "board"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              <Kanban className="h-3 w-3" />
              Board
            </button>
          </div>
        </div>

        {/* Active view */}
        {activeType === "board" ? (
          <BoardView database={database} />
        ) : (
          <TableView database={database} />
        )}
      </div>
    </NodeViewWrapper>
  );
}
