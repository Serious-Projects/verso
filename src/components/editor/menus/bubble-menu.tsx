"use client";

import { NodeSelection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import {
  Bold,
  ChevronDown,
  Code,
  Highlighter,
  Italic,
  Palette,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#737373" },
  { name: "Brown", value: "#92400e" },
  { name: "Orange", value: "#c2410c" },
  { name: "Yellow", value: "#a16207" },
  { name: "Green", value: "#15803d" },
  { name: "Blue", value: "#1d4ed8" },
  { name: "Purple", value: "#7c3aed" },
  { name: "Pink", value: "#be185d" },
  { name: "Red", value: "#dc2626" },
];

const HIGHLIGHT_COLORS = [
  { name: "Default", value: "" },
  { name: "Gray", value: "#e5e5e5" },
  { name: "Brown", value: "#fde68a" },
  { name: "Orange", value: "#fed7aa" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Purple", value: "#ddd6fe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Red", value: "#fecaca" },
];

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ColorDropdown({ editor, type }: { editor: Editor; type: "text" | "highlight" }) {
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const colors = type === "text" ? TEXT_COLORS : HIGHLIGHT_COLORS;
  const isText = type === "text";

  // Get current active color
  const currentColor = isText
    ? (editor.getAttributes("textStyle")?.color as string) || ""
    : (editor.getAttributes("highlight")?.color as string) || "";

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const applyColor = (color: string) => {
    if (isText) {
      if (!color) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
    } else {
      if (!color) {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().toggleHighlight({ color }).run();
      }
    }
    setOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseDown={(e) => e.preventDefault()}
        title={isText ? "Text color" : "Highlight color"}
        className={`flex h-8 items-center gap-0.5 rounded-md px-1.5 transition-colors ${
          currentColor
            ? "bg-accent text-accent-foreground"
            : "text-popover-foreground hover:bg-muted"
        }`}
        data-testid={isText ? "text-color-btn" : "highlight-color-btn"}
      >
        {isText ? (
          <span className="flex flex-col items-center">
            <Palette className="h-3.5 w-3.5" />
            <span
              className="mt-0.5 h-0.5 w-3.5 rounded-full"
              style={{
                backgroundColor: currentColor || "currentColor",
              }}
            />
          </span>
        ) : (
          <span className="flex flex-col items-center">
            <Highlighter className="h-3.5 w-3.5" />
            <span
              className="mt-0.5 h-0.5 w-3.5 rounded-full"
              style={{
                backgroundColor: currentColor || "currentColor",
              }}
            />
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div
          className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded-lg border border-border bg-popover p-2.5 shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
          data-testid={isText ? "text-color-picker" : "highlight-color-picker"}
        >
          <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
            {isText ? "Text color" : "Background"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "4px",
            }}
          >
            {colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => applyColor(c.value)}
                title={c.name}
                data-color={c.value || "default"}
                className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                  currentColor === c.value || (!currentColor && !c.value)
                    ? "border-primary ring-1 ring-primary"
                    : "border-transparent hover:border-border"
                }`}
              >
                {!c.value ? (
                  <span className="relative h-5 w-5 rounded-sm border border-border">
                    <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-muted-foreground" />
                  </span>
                ) : isText ? (
                  <span className="text-base font-bold" style={{ color: c.value }}>
                    A
                  </span>
                ) : (
                  <span className="h-5 w-5 rounded-sm" style={{ backgroundColor: c.value }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function BubbleMenuBar({ editor }: { editor: Editor }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [, setRenderTick] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenu = useCallback(() => {
    const { state } = editor;
    const { selection } = state;
    const { empty, from, to } = selection;

    if (empty || from === to) {
      setVisible(false);
      return;
    }

    // Hide for node selections on atom blocks (database, image, video, etc.)
    if (selection instanceof NodeSelection) {
      setVisible(false);
      return;
    }

    const $from = state.doc.resolve(from);
    if ($from.parent.type.name === "codeBlock") {
      setVisible(false);
      return;
    }

    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const left = (start.left + end.left) / 2;
    const top = start.top - 48;

    setPosition({ top: Math.max(top, 8), left });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    const handleSelectionUpdate = () => updateMenu();
    const handleTransaction = () => setRenderTick((t) => t + 1);
    const handleBlur = () => {
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) {
          setVisible(false);
        }
      }, 150);
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleTransaction);
    editor.on("blur", handleBlur);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleTransaction);
      editor.off("blur", handleBlur);
    };
  }, [editor, updateMenu]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline code (Ctrl+E)"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <div className="mx-0.5 h-5 w-px bg-border" />

      <ColorDropdown editor={editor} type="text" />
      <ColorDropdown editor={editor} type="highlight" />
    </div>
  );
}
