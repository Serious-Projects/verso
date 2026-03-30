"use client";

import { Filter, Group, SortAsc } from "lucide-react";
import { useCallback, useState } from "react";

import type { DatabaseProperty, DatabaseView } from "@/types/database";
import { Dropdown } from "./dropdown";
import { FilterPanel } from "./filter-panel";
import { GroupPanel } from "./group-panel";
import { SortPanel } from "./sort-panel";


interface FilterSortBarProps {
  dbId: string;
  view: DatabaseView;
  properties: DatabaseProperty[];
}

export function FilterSortBar({ dbId, view, properties }: FilterSortBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const openFilter = useCallback((v: boolean) => { setFilterOpen(v); if (v) { setSortOpen(false); setGroupOpen(false); } }, []);
  const openSort = useCallback((v: boolean) => { setSortOpen(v); if (v) { setFilterOpen(false); setGroupOpen(false); } }, []);
  const openGroup = useCallback((v: boolean) => { setGroupOpen(v); if (v) { setFilterOpen(false); setSortOpen(false); } }, []);

  const hasFilters = view.filters.length > 0;
  const hasSorts = view.sorts.length > 0;
  const hasGroup = !!view.groupBy;

  return (
    <div className="flex items-center gap-1 border-b border-border/20 px-4 py-1.5">
      <Dropdown
        open={filterOpen}
        onOpenChange={openFilter}
        width="w-80"
        testId="filter-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openFilter(!filterOpen)}
            data-testid="filter-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasFilters
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <Filter className="h-3 w-3" />
            Filter{hasFilters ? ` (${view.filters.length})` : ""}
          </button>
        }
      >
        <FilterPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>

      <Dropdown
        open={sortOpen}
        onOpenChange={openSort}
        width="w-72"
        testId="sort-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openSort(!sortOpen)}
            data-testid="sort-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasSorts
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <SortAsc className="h-3 w-3" />
            Sort{hasSorts ? ` (${view.sorts.length})` : ""}
          </button>
        }
      >
        <SortPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>

      <Dropdown
        open={groupOpen}
        onOpenChange={openGroup}
        width="w-56"
        testId="group-panel"
        className="relative"
        trigger={
          <button
            type="button"
            onClick={() => openGroup(!groupOpen)}
            data-testid="group-btn"
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
              hasGroup
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/30"
            }`}
          >
            <Group className="h-3 w-3" />
            Group{hasGroup ? " (1)" : ""}
          </button>
        }
      >
        <GroupPanel dbId={dbId} view={view} properties={properties} />
      </Dropdown>
    </div>
  );
}
