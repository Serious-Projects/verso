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

import { usePageStore } from "@/stores/page-store";
import { Breadcrumbs } from "./breadcrumbs";
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

const SAVE_DELAY = 500;

interface IconEntry {
  emoji: string;
  keywords: string;
}

const ICON_CATEGORIES: { label: string; icons: IconEntry[] }[] = [
  {
    label: "Docs",
    icons: [
      { emoji: "📄", keywords: "page document file" },
      { emoji: "📝", keywords: "note memo write" },
      { emoji: "📋", keywords: "clipboard list" },
      { emoji: "📌", keywords: "pin pinned" },
      { emoji: "📎", keywords: "paperclip attach" },
      { emoji: "🗂️", keywords: "folder index tab" },
      { emoji: "📁", keywords: "folder directory" },
      { emoji: "📂", keywords: "open folder" },
      { emoji: "🔖", keywords: "bookmark tag" },
      { emoji: "📜", keywords: "scroll document" },
      { emoji: "📃", keywords: "page document" },
      { emoji: "🗒️", keywords: "spiral notepad" },
    ],
  },
  {
    label: "Ideas",
    icons: [
      { emoji: "💡", keywords: "idea light bulb" },
      { emoji: "🚀", keywords: "rocket launch startup" },
      { emoji: "⚡", keywords: "lightning bolt fast" },
      { emoji: "🔥", keywords: "fire hot trending" },
      { emoji: "✨", keywords: "sparkles magic" },
      { emoji: "💫", keywords: "dizzy star spark" },
      { emoji: "🌟", keywords: "star glow bright" },
      { emoji: "🎯", keywords: "target goal aim" },
      { emoji: "🧠", keywords: "brain mind think" },
      { emoji: "🔮", keywords: "crystal ball vision" },
      { emoji: "🌈", keywords: "rainbow color" },
      { emoji: "🎪", keywords: "circus tent event" },
    ],
  },
  {
    label: "Work",
    icons: [
      { emoji: "💼", keywords: "briefcase work job" },
      { emoji: "🏢", keywords: "office building company" },
      { emoji: "🤝", keywords: "handshake deal partner" },
      { emoji: "📊", keywords: "chart bar graph data" },
      { emoji: "📈", keywords: "chart trend up growth" },
      { emoji: "📉", keywords: "chart trend down" },
      { emoji: "🗓️", keywords: "calendar schedule" },
      { emoji: "⏰", keywords: "alarm clock time" },
      { emoji: "🔑", keywords: "key access" },
      { emoji: "🏆", keywords: "trophy award win" },
      { emoji: "🎖️", keywords: "medal award" },
      { emoji: "💰", keywords: "money bag finance" },
    ],
  },
  {
    label: "Creative",
    icons: [
      { emoji: "🎨", keywords: "art palette paint" },
      { emoji: "✏️", keywords: "pencil draw edit" },
      { emoji: "🎬", keywords: "film clapper movie" },
      { emoji: "🎵", keywords: "music note audio" },
      { emoji: "📸", keywords: "camera photo" },
      { emoji: "🎭", keywords: "theater drama" },
      { emoji: "🖼️", keywords: "picture frame art" },
      { emoji: "🎹", keywords: "piano keyboard music" },
      { emoji: "🎸", keywords: "guitar music" },
      { emoji: "🎤", keywords: "microphone sing" },
      { emoji: "🎃", keywords: "halloween pumpkin" },
      { emoji: "🌸", keywords: "flower blossom" },
    ],
  },
  {
    label: "Learn",
    icons: [
      { emoji: "📚", keywords: "books study read" },
      { emoji: "🎓", keywords: "graduation school" },
      { emoji: "🔬", keywords: "microscope science" },
      { emoji: "🧪", keywords: "test tube experiment" },
      { emoji: "🧬", keywords: "dna biology" },
      { emoji: "🔭", keywords: "telescope space" },
      { emoji: "🗺️", keywords: "map world travel" },
      { emoji: "🧭", keywords: "compass direction" },
      { emoji: "🔍", keywords: "search magnify" },
      { emoji: "📡", keywords: "satellite antenna" },
      { emoji: "🌐", keywords: "globe web internet" },
      { emoji: "📐", keywords: "ruler geometry math" },
    ],
  },
  {
    label: "Life",
    icons: [
      { emoji: "❤️", keywords: "heart love" },
      { emoji: "🏠", keywords: "house home" },
      { emoji: "🌿", keywords: "plant leaf nature" },
      { emoji: "☕", keywords: "coffee tea drink" },
      { emoji: "🌙", keywords: "moon night" },
      { emoji: "⭐", keywords: "star favorite" },
      { emoji: "🎁", keywords: "gift present" },
      { emoji: "🏋️", keywords: "gym fitness workout" },
      { emoji: "🌊", keywords: "wave ocean water" },
      { emoji: "🦋", keywords: "butterfly nature" },
      { emoji: "🍀", keywords: "clover luck" },
      { emoji: "🐾", keywords: "paw pet animal" },
    ],
  },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface EditorProps {
  pageId: string;
}

export function Editor({ pageId }: EditorProps) {
  // Store
  const updatePage = usePageStore((state) => state.updatePage);
  const page = usePageStore((state) => state.pages[pageId]);
  const hasHydrated = usePageStore((state) => state._hasHydrated);

  // Refs (needed before editor for stable closure references)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loadedForPageRef = useRef<string | null>(null); // tracks which pageId content was loaded for
  const pageIdRef = useRef(pageId); // always current pageId for onUpdate closure
  useEffect(() => { pageIdRef.current = pageId; }, [pageId]);

  // Editor
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
    onUpdate: ({ editor: e }) => {
      const content = e.getJSON() as Record<string, unknown>;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      setSaveStatus("saving");
      saveTimeout.current = setTimeout(() => {
        try {
          updatePage(pageIdRef.current, { content }); // always uses current pageId
          setSaveStatus("saved");
          hideTimeout.current = setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
        }
      }, SAVE_DELAY);
    },
    immediatelyRender: false,
  });

  // State
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  // Load content once hydration is complete, and whenever pageId changes
  useEffect(() => {
    if (!editor || !hasHydrated) return;
    if (loadedForPageRef.current === pageId) return; // already loaded for this page
    loadedForPageRef.current = pageId;
    const stored = usePageStore.getState().pages[pageId];
    const content = stored?.content && Object.keys(stored.content).length > 0 ? stored.content : "";
    editor.commands.setContent(content, false); // false = don't fire onUpdate
  }, [editor, pageId, hasHydrated]);

  // Load title once hydration is complete
  useEffect(() => {
    if (!titleRef.current || !hasHydrated) return;
    const stored = usePageStore.getState().pages[pageId];
    const title = stored?.title ?? "";
    titleRef.current.textContent = title;
    titleRef.current.classList.toggle("is-empty", title.trim().length === 0);
  }, [hasHydrated, pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flush save on tab switch / page close
  useEffect(() => {
    const flushSave = () => {
      if (!editor || editor.isDestroyed) return;
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      try {
        updatePage(pageId, { content: editor.getJSON() as Record<string, unknown> });
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
  }, [editor, pageId, updatePage]);

  const handleTitleInput = useCallback(
    (e: React.FormEvent<HTMLHeadingElement>) => {
      const text = e.currentTarget.textContent ?? "";
      updatePage(pageId, { title: text });
      e.currentTarget.classList.toggle("is-empty", text.trim().length === 0);
    },
    [pageId, updatePage],
  );

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        editor?.commands.focus("start");
      }
    },
    [editor],
  );

  const selectIcon = useCallback(
    (icon: string) => {
      setShowIconPicker(false);
      updatePage(pageId, { icon });
    },
    [pageId, updatePage],
  );

  if (!editor) return null;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Save status */}
      {saveStatus !== "idle" && (
        <div
          className={`absolute right-6 top-6 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-md transition-all duration-300 ${
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

      {/* Breadcrumbs */}
      <Breadcrumbs pageId={pageId} />

      {/* Page header */}
      <div className="px-16 pt-16 pb-6">
        {/* Icon */}
        <div className="relative mb-5">
          <button
            type="button"
            onClick={() => {
              setShowIconPicker((v) => !v);
              setIconSearch("");
              setActiveCategory(0);
            }}
            className="group text-5xl leading-none rounded-2xl p-2 -ml-2 transition-all duration-200 hover:bg-muted/60 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Change page icon"
            data-testid="page-icon"
          >
            {page?.icon || "📄"}
          </button>

          {showIconPicker && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowIconPicker(false)} />
              {/* Picker panel */}
              <div
                className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/50 bg-popover/95 shadow-2xl backdrop-blur-xl ring-1 ring-border/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="border-b border-border/40 px-3 pt-3 pb-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Choose icon
                  </p>
                  {/* Search */}
                  <div className="relative">
                    <svg
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                      <path
                        d="M10 10l3 3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search icons..."
                      value={iconSearch}
                      onChange={(e) => setIconSearch(e.target.value)}
                      className="w-full rounded-lg bg-muted/60 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Category tabs */}
                {!iconSearch && (
                  <div className="flex gap-0.5 overflow-x-auto border-b border-border/40 px-2 py-1.5 scrollbar-none">
                    {ICON_CATEGORIES.map((cat, i) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setActiveCategory(i)}
                        className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                          activeCategory === i
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Icons grid */}
                <div className="p-2.5">
                  {(() => {
                    const q = iconSearch.toLowerCase();
                    const icons = q
                      ? ICON_CATEGORIES.flatMap((c) => c.icons).filter((ic) =>
                          ic.keywords.includes(q),
                        )
                      : ICON_CATEGORIES[activeCategory].icons;
                    return icons.length > 0 ? (
                      <div className="grid grid-cols-8 gap-0.5">
                        {icons.map((ic) => (
                          <button
                            key={ic.emoji}
                            type="button"
                            onClick={() => selectIcon(ic.emoji)}
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all duration-100 hover:bg-primary/10 hover:scale-110 ${
                              page?.icon === ic.emoji ? "bg-primary/15 ring-1 ring-primary/30" : ""
                            }`}
                          >
                            {ic.emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-muted-foreground/50">
                        No icons found
                      </p>
                    );
                  })()}
                </div>

                {/* Remove icon footer */}
                <div className="border-t border-border/40 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => selectIcon("📄")}
                    className="w-full rounded-lg py-1.5 text-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Reset to default
                  </button>
                </div>
              </div>
            </>
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
          className="page-title is-empty text-5xl font-black leading-[1.1] tracking-[-0.04em] text-foreground outline-none"
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
