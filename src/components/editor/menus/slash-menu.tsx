"use client";

import { Editor } from "@tiptap/react";
import {
  CheckSquare,
  ChevronRight,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  List,
  ListOrdered,
  Minus,
  Quote,
  Type,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { dismissSlashCommand } from "../extensions/slash-command";

interface SlashMenuItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  aliases: string[];
  command: (editor: Editor) => void;
}

const SLASH_ITEMS: SlashMenuItem[] = [
  {
    title: "Text",
    description: "Plain text block",
    icon: <Type className="h-4 w-4" />,
    aliases: ["paragraph", "p", "text"],
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: <Heading1 className="h-4 w-4" />,
    aliases: ["h1", "heading1", "title"],
    command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    aliases: ["h2", "heading2", "subtitle"],
    command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    aliases: ["h3", "heading3"],
    command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Unordered list",
    icon: <List className="h-4 w-4" />,
    aliases: ["ul", "bullet", "unordered", "list"],
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Ordered list with numbers",
    icon: <ListOrdered className="h-4 w-4" />,
    aliases: ["ol", "numbered", "ordered"],
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "To-do List",
    description: "Checklist with checkboxes",
    icon: <CheckSquare className="h-4 w-4" />,
    aliases: ["todo", "task", "checkbox", "check"],
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Block quote",
    icon: <Quote className="h-4 w-4" />,
    aliases: ["blockquote", "quote", "q"],
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: <Code className="h-4 w-4" />,
    aliases: ["code", "codeblock", "pre", "snippet"],
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Callout",
    description: "Highlighted info block",
    icon: <Lightbulb className="h-4 w-4" />,
    aliases: ["callout", "info", "note", "tip", "warning"],
    command: (editor) => editor.chain().focus().setCallout().run(),
  },
  {
    title: "Toggle",
    description: "Collapsible content block",
    icon: <ChevronRight className="h-4 w-4" />,
    aliases: ["toggle", "collapsible", "accordion", "dropdown"],
    command: (editor) => editor.chain().focus().setToggle().run(),
  },
  {
    title: "Divider",
    description: "Horizontal line separator",
    icon: <Minus className="h-4 w-4" />,
    aliases: ["divider", "hr", "separator", "line", "---"],
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  // Simple fuzzy: all query chars appear in order
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function filterItems(query: string): SlashMenuItem[] {
  if (!query) return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) =>
      fuzzyMatch(query, item.title) || item.aliases.some((alias) => fuzzyMatch(query, alias)),
  );
}

export function SlashMenu({ editor }: { editor: Editor }) {
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => filterItems(query), [query]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  // Listen for slash command events
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActive(detail.active);
      setQuery(detail.query);
    };

    window.addEventListener("slash-command-update", handleUpdate);
    return () => window.removeEventListener("slash-command-update", handleUpdate);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeydown = (e: Event) => {
      const key = (e as CustomEvent).detail.key;

      if (key === "ArrowDown") {
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (key === "ArrowUp") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (key === "Enter") {
        if (filteredItems[selectedIndex]) {
          executeCommand(filteredItems[selectedIndex]);
        } else {
          // No results — just dismiss
          dismissSlashCommand(editor);
        }
      } else if (key === "Escape") {
        dismissSlashCommand(editor);
      }
    };

    window.addEventListener("slash-command-keydown", handleKeydown);
    return () => window.removeEventListener("slash-command-keydown", handleKeydown);
  }, [filteredItems, selectedIndex, editor]);

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return;
    const selected = menuRef.current.querySelector("[data-selected=true]");
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeCommand = useCallback(
    (item: SlashMenuItem) => {
      dismissSlashCommand(editor);
      item.command(editor);
    },
    [editor],
  );

  useEffect(() => {
    if (!active) return;

    const updatePosition = () => {
      const { view } = editor;
      const { from } = view.state.selection;
      const coords = view.coordsAtPos(from);

      // Position below the current line
      setPosition({
        top: coords.bottom + 8,
        left: coords.left,
      });
    };

    updatePosition();
  }, [active, editor, query]);

  if (!active || filteredItems.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 slide-in-from-top-2"
      style={{ top: position.top, left: position.left }}
    >
      {filteredItems.map((item, index) => (
        <button
          key={item.title}
          data-selected={index === selectedIndex}
          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "text-popover-foreground hover:bg-muted"
          }`}
          onClick={() => executeCommand(item)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
              index === selectedIndex
                ? "border-accent-foreground/20 bg-accent-foreground/10 text-accent-foreground"
                : "border-border bg-background text-foreground"
            }`}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <div className="font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
