"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

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
  const [focusedIndex, setFocusedIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === value)),
  );
  const selected = options.find((o) => o.value === value);
  const listboxId = useId();
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleOpen = useCallback(() => {
    setFocusedIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }, [options, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(next);
          optionRefs.current[next]?.focus();
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
          setFocusedIndex(prev);
          optionRefs.current[prev]?.focus();
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          if (options[focusedIndex]) {
            onChange(options[focusedIndex].value);
            setOpen(false);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [open, focusedIndex, options, onChange],
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      width={width}
      className="relative"
      trigger={
        <button
          type="button"
          onClick={handleOpen}
          data-testid={testId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
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
      <div
        id={listboxId}
        role="listbox"
        aria-activedescendant={options[focusedIndex] ? `${listboxId}-${focusedIndex}` : undefined}
        onKeyDown={handleKeyDown}
        className="max-h-52 overflow-y-auto p-1"
      >
        {options.map((opt, i) => (
          <button
            key={opt.value}
            ref={(el) => { optionRefs.current[i] = el; }}
            id={`${listboxId}-${i}`}
            role="option"
            aria-selected={opt.value === value}
            tabIndex={i === focusedIndex ? 0 : -1}
            type="button"
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            onMouseEnter={() => setFocusedIndex(i)}
            onFocus={() => setFocusedIndex(i)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors outline-none ${
              i === focusedIndex
                ? "bg-muted/40"
                : ""
            } ${
              opt.value === value
                ? "text-primary"
                : "text-foreground/80"
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
