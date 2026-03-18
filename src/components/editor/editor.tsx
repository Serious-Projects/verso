"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";

import { Callout } from "./extensions/callout";
import { KeyboardShortcuts } from "./extensions/keyboard-shortcuts";
import { MarkdownPaste } from "./extensions/markdown-paste";
import { MarkdownShortcuts } from "./extensions/markdown-shortcuts";
import { SlashCommand } from "./extensions/slash-command";
import { ToggleBlock } from "./extensions/toggle";
import { TrimSelection } from "./extensions/trim-selection";
import { BlockHandle } from "./menus/block-handle";
import { BubbleMenuBar } from "./menus/bubble-menu";
import { SlashMenu } from "./menus/slash-menu";

const lowlight = createLowlight(common);

const STORAGE_KEY = "verso-document";
const SAVE_DELAY = 500;

type SaveStatus = "idle" | "saving" | "saved" | "error";

const PAGE_ICONS = [
  "📄",
  "📝",
  "📋",
  "📌",
  "📎",
  "🗂️",
  "📁",
  "📂",
  "💡",
  "🎯",
  "🚀",
  "⚡",
  "🔥",
  "✨",
  "💫",
  "🌟",
  "🎨",
  "🎬",
  "🎵",
  "📸",
  "🏗️",
  "🔧",
  "⚙️",
  "🛠️",
  "📊",
  "📈",
  "📉",
  "🗺️",
  "🧭",
  "🔍",
  "🧪",
  "🧬",
  "💼",
  "🏠",
  "🎓",
  "📚",
  "✅",
  "❤️",
  "🧠",
  "🤝",
];

export function Editor() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        horizontalRule: {
          HTMLAttributes: { class: "my-6 border-border" },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Type '/' for commands...";
        },
        includeChildren: true,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: { class: "bg-primary/20 rounded-sm px-0.5" },
      }),
      TextStyle,
      Color,
      TaskList.configure({
        HTMLAttributes: { class: "not-prose" },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "flex items-start gap-2" },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: "rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto my-2",
        },
      }),
      Callout,
      ToggleBlock,
      SlashCommand,
      KeyboardShortcuts,
      MarkdownShortcuts,
      MarkdownPaste,
      TrimSelection,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "verso-editor min-h-[50vh] px-16 pb-32 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      saveContent(JSON.stringify(editor.getJSON()));
    },
    immediatelyRender: false,
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pageIcon, setPageIcon] = useState("📄");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Load saved content
  useEffect(() => {
    if (!editor) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        editor.commands.setContent(JSON.parse(saved));
      }
    } catch {
      // Invalid saved content — start fresh
    }
  }, [editor]);

  // Load saved title and icon
  useEffect(() => {
    if (!editor) return;
    const savedTitle = localStorage.getItem("verso-page-title");
    if (savedTitle && titleRef.current) {
      titleRef.current.textContent = savedTitle;
      if (savedTitle.trim().length > 0) {
        titleRef.current.classList.remove("is-empty");
      }
    }
    const savedIcon = localStorage.getItem("verso-page-icon");
    if (savedIcon) setPageIcon(savedIcon);
  }, [editor]);

  // Flush save on tab switch / page close + cleanup
  useEffect(() => {
    const flushSave = () => {
      if (!editor || editor.isDestroyed) return;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.getJSON()));
        setSaveStatus("saved");
      } catch {
        // ignore
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flushSave();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", flushSave);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", flushSave);
      flushSave();
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, [editor]);

  const saveContent = useCallback((content: string) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);

    setSaveStatus("saving");

    saveTimeout.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
        setSaveStatus("saved");
        hideTimeout.current = setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    }, SAVE_DELAY);
  }, []);

  const handleTitleInput = useCallback((e: React.FormEvent<HTMLHeadingElement>) => {
    const text = e.currentTarget.textContent || "";
    localStorage.setItem("verso-page-title", text);
    e.currentTarget.classList.toggle("is-empty", text.trim().length === 0);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        editor?.commands.focus("start");
      }
    },
    [editor],
  );

  const selectIcon = useCallback((icon: string) => {
    setPageIcon(icon);
    setShowIconPicker(false);
    localStorage.setItem("verso-page-icon", icon);
  }, []);

  if (!editor) return null;

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Save status */}
      {saveStatus !== "idle" && (
        <div
          className={`absolute right-6 top-6 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-all duration-300 ${
            saveStatus === "saving"
              ? "border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              : saveStatus === "saved"
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "border-red-200 bg-red-50/80 text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          }`}
        >
          {saveStatus === "saving" && (
            <>
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="28"
                  strokeDashoffset="8"
                  strokeLinecap="round"
                />
              </svg>
              Saving
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8.5L6.5 12L13 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Saved
            </>
          )}
          {saveStatus === "error" && (
            <>
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 4v5M8 11.5v.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Error
            </>
          )}
        </div>
      )}

      {/* Page header */}
      <div className="px-16 pt-20 pb-4">
        {/* Icon */}
        <div className="relative mb-3">
          <button
            type="button"
            onClick={() => setShowIconPicker((v) => !v)}
            className="text-5xl leading-none hover:bg-muted rounded-lg p-1 -ml-1 transition-colors"
            data-testid="page-icon"
          >
            {pageIcon}
          </button>
          {showIconPicker && (
            <div
              className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-3 shadow-lg"
              onMouseDown={(e) => e.preventDefault()}
            >
              <p className="mb-2 text-xs font-medium text-muted-foreground">Choose icon</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: "2px",
                }}
              >
                {PAGE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => selectIcon(icon)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-muted transition-colors"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          onKeyDown={handleTitleKeyDown}
          data-testid="page-title"
          data-placeholder="Untitled"
          className="page-title is-empty text-4xl font-bold leading-tight tracking-tight text-foreground outline-none"
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      <BubbleMenuBar editor={editor} />
      <SlashMenu editor={editor} />
      <BlockHandle editor={editor} />
    </div>
  );
}
