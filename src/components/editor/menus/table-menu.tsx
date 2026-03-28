"use client";

import { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns3,
  Plus,
  Rows3,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TableMenuProps {
  editor: Editor | null;
}

interface TableRects {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

interface ActionBtn {
  icon: React.ReactNode;
  label: string;
  testId: string;
  onClick: () => void;
  danger?: boolean;
}

export function TableMenu({ editor }: TableMenuProps) {
  const [rects, setRects] = useState<TableRects | null>(null);

  const update = useCallback(() => {
    if (!editor) return;

    const inTable = editor.isActive("tableCell") || editor.isActive("tableHeader");

    // Hide when text is selected — bubble menu handles that state
    if (!inTable || !editor.state.selection.empty) {
      setRects(null);
      return;
    }

    const { view } = editor;
    const { from } = view.state.selection;

    try {
      const domInfo = view.domAtPos(from);
      let el: Element | null =
        domInfo.node instanceof Element ? domInfo.node : domInfo.node.parentElement;

      while (el && el.tagName.toLowerCase() !== "table") {
        el = el.parentElement;
      }

      if (el) {
        const r = el.getBoundingClientRect();
        setRects({
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
        });
      }
    } catch {
      // ignore position errors
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on("selectionUpdate", update);
    editor.on("focus", update);
    editor.on("blur", () => setRects(null));
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      editor.off("selectionUpdate", update);
      editor.off("focus", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor, update]);

  if (!rects || !editor) return null;

  const toolbarActions: (ActionBtn | "divider")[] = [
    {
      icon: <AlignLeft className="h-3.5 w-3.5" />,
      label: "Align left",
      testId: "table-align-left",
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      icon: <AlignCenter className="h-3.5 w-3.5" />,
      label: "Align center",
      testId: "table-align-center",
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      icon: <AlignRight className="h-3.5 w-3.5" />,
      label: "Align right",
      testId: "table-align-right",
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
    },
    "divider",
    {
      icon: <ArrowLeftToLine className="h-3.5 w-3.5" />,
      label: "Add column before",
      testId: "table-add-col-before",
      onClick: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      icon: <ArrowRightToLine className="h-3.5 w-3.5" />,
      label: "Add column after",
      testId: "table-add-col-after",
      onClick: () => editor.chain().focus().addColumnAfter().run(),
    },
    "divider",
    {
      icon: <ArrowUpToLine className="h-3.5 w-3.5" />,
      label: "Add row before",
      testId: "table-add-row-before",
      onClick: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
      label: "Add row after",
      testId: "table-add-row-after",
      onClick: () => editor.chain().focus().addRowAfter().run(),
    },
    "divider",
    {
      icon: <Columns3 className="h-3.5 w-3.5" />,
      label: "Delete column",
      testId: "table-delete-col",
      onClick: () => editor.chain().focus().deleteColumn().run(),
      danger: true,
    },
    {
      icon: <Rows3 className="h-3.5 w-3.5" />,
      label: "Delete row",
      testId: "table-delete-row",
      onClick: () => editor.chain().focus().deleteRow().run(),
      danger: true,
    },
    "divider",
    {
      icon: <Trash2 className="h-3.5 w-3.5" />,
      label: "Delete table",
      testId: "table-delete",
      onClick: () => editor.chain().focus().deleteTable().run(),
      danger: true,
    },
  ];

  return (
    <>
      {/* Toolbar — anchored to the TOP of the table, not the cursor */}
      <div
        data-testid="table-menu"
        className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border/60 bg-popover/95 px-1 py-1 shadow-md backdrop-blur-sm animate-in fade-in-0"
        style={{ top: rects.top - 44, left: rects.left }}
      >
        {toolbarActions.map((action, i) =>
          action === "divider" ? (
            <div key={i} className="mx-0.5 h-4 w-px bg-border/50" />
          ) : (
            <button
              key={action.testId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                action.onClick();
              }}
              data-testid={action.testId}
              title={action.label}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                action.danger
                  ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {action.icon}
            </button>
          ),
        )}
      </div>

      {/* + Add row — below the table */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addRowAfter().run();
        }}
        title="Add row"
        className="fixed z-40 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40 rounded transition-all duration-150 group"
        style={{
          top: rects.bottom + 1,
          left: rects.left,
          width: rects.width,
          height: 24,
        }}
      >
        <Plus className="h-3 w-3" />
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Add row</span>
      </button>

      {/* + Add column — to the right of the table */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().addColumnAfter().run();
        }}
        title="Add column"
        className="fixed z-40 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/40 rounded transition-all duration-150"
        style={{
          top: rects.top,
          left: rects.right + 1,
          width: 24,
          height: rects.height,
        }}
      >
        <Plus className="h-3 w-3" />
      </button>
    </>
  );
}
