"use client";

import { X } from "lucide-react";

import { useDatabaseStore } from "@/stores/database-store";
import type { DatabaseProperty, DatabaseView } from "@/types/database";
import { PropertyIcon } from "./property-icon";

interface GroupPanelProps {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}

export function GroupPanel({ dbId, view, properties }: GroupPanelProps) {
  const updateView = useDatabaseStore((s) => s.updateView);

  const groupableProps = properties.filter((p) =>
    ["select", "multi_select", "status", "checkbox"].includes(p.type),
  );

  return (
    <div className="p-2">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Group by
      </p>

      <button
        type="button"
        onClick={() => updateView(dbId, view.id, { groupBy: undefined })}
        data-testid="group-none"
        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 ${
          !view.groupBy ? "bg-muted/30 text-primary font-medium" : "text-foreground/80"
        }`}
      >
        <X className="h-3 w-3 text-muted-foreground/40" />
        None
      </button>

      {groupableProps.map((prop) => (
        <button
          key={prop.id}
          type="button"
          onClick={() => updateView(dbId, view.id, { groupBy: prop.id })}
          data-testid={`group-by-${prop.name.toLowerCase().replace(/\s+/g, "-")}`}
          className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/40 ${
            view.groupBy === prop.id ? "bg-muted/30 text-primary font-medium" : "text-foreground/80"
          }`}
        >
          <PropertyIcon type={prop.type} />
          {prop.name}
        </button>
      ))}

      {groupableProps.length === 0 && (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/40">
          Add a Select or Checkbox column to enable grouping
        </p>
      )}
    </div>
  );
}
