"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Dropdown } from "./dropdown";

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectInputProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
  width?: string;
}

export function SelectInput({
  value,
  options,
  onChange,
  placeholder = "Select...",
  testId,
  width = "w-40",
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      width={width}
      className="relative"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-testid={testId}
          className="flex h-7 items-center gap-1 rounded-md border border-border/30 bg-muted/20 px-2 text-xs hover:bg-muted/30 transition-colors"
        >
          {selected?.icon}
          <span className={selected ? "text-foreground" : "text-muted-foreground/50"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="ml-0.5 h-3 w-3 text-muted-foreground/40" />
        </button>
      }
    >
      <div className="max-h-52 overflow-y-auto p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
              opt.value === value
                ? "bg-primary/10 text-primary"
                : "text-foreground/80 hover:bg-muted/40"
            }`}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
            {opt.value === value && <Check className="ml-auto h-3 w-3 text-primary" />}
          </button>
        ))}
      </div>
    </Dropdown>
  );
}
