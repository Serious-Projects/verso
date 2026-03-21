import { Extension } from "@tiptap/core";
import { DOMParser as ProseMirrorDOMParser, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { marked } from "marked";

const MARKDOWN_PASTE_KEY = new PluginKey("markdownPaste");

// Heuristic: does this look like Markdown?
function looksLikeMarkdown(text: string): boolean {
  const lines = text.split("\n");
  let mdSignals = 0;

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (/^#{1,6}\s/.test(trimmed)) mdSignals++;
    if (/^[-*+]\s/.test(trimmed)) mdSignals++;
    if (/^\d+\.\s/.test(trimmed)) mdSignals++;
    if (trimmed.startsWith("```")) mdSignals++;
    if (trimmed.startsWith("> ")) mdSignals++;
    if (/\[.+\]\(.+\)/.test(trimmed)) mdSignals++;
    if (/(\*\*|__).+(\*\*|__)/.test(trimmed)) mdSignals++;
    if (/^(---|\*\*\*|___)$/.test(trimmed)) mdSignals++;
    if (/^[-*]\s\[[ x]\]\s/.test(trimmed)) mdSignals++;
    if (/^\|.+\|/.test(trimmed)) mdSignals++;
  }

  return mdSignals >= 2 || (lines.length > 3 && mdSignals / lines.length > 0.15);
}

// Convert marked's task list output to Tiptap-compatible HTML
function fixTaskListHtml(html: string): string {
  return html.replace(
    /<li><input\s+(?:checked(?:="")?\s+)?(?:disabled(?:="")?\s+)?type="checkbox"\s*(?:checked(?:="")?\s*)?(?:disabled(?:="")?\s*)?>\s*/gi,
    (match) => {
      const isChecked = /checked/i.test(match);
      return `<li data-type="taskItem" data-checked="${isChecked}"><p>`;
    },
  );
}

// Wrap task list <ul> containing taskItems with data-type="taskList"
function fixTaskListWrappers(html: string): string {
  // If a <ul> contains <li data-type="taskItem">, mark it as a taskList
  return html.replace(/<ul>\s*(<li data-type="taskItem")/g, '<ul data-type="taskList">$1');
}

// Convert table HTML to readable text since we don't have table blocks yet
function simplifyTables(container: HTMLElement): void {
  container.querySelectorAll("table").forEach((table) => {
    const rows: string[][] = [];
    table.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("th, td").forEach((cell) => {
        cells.push(cell.innerHTML.trim());
      });
      rows.push(cells);
    });

    const replacement = document.createElement("div");
    rows.forEach((row, i) => {
      const p = document.createElement("p");
      if (i === 0) {
        p.innerHTML = row.map((c) => `<strong>${c}</strong>`).join(" | ");
      } else {
        p.innerHTML = row.join(" | ");
      }
      replacement.appendChild(p);
    });

    table.replaceWith(...replacement.childNodes);
  });
}

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: MARKDOWN_PASTE_KEY,
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            // If there's HTML content, let ProseMirror handle it natively
            const html = clipboard.getData("text/html");
            if (html && html.trim().length > 0) return false;

            const text = clipboard.getData("text/plain");
            if (!text || !looksLikeMarkdown(text)) return false;

            // Convert markdown to HTML
            let parsedHtml = marked.parse(text, {
              async: false,
              gfm: true,
              breaks: false,
            }) as string;

            // Post-process for Tiptap compatibility
            parsedHtml = fixTaskListHtml(parsedHtml);
            parsedHtml = fixTaskListWrappers(parsedHtml);

            // Parse HTML into DOM, then fix tables, then parse into ProseMirror
            const wrapper = document.createElement("div");
            wrapper.innerHTML = parsedHtml;
            simplifyTables(wrapper);

            // Use ProseMirror's DOMParser with the full schema
            const parser = ProseMirrorDOMParser.fromSchema(editor.schema);
            const doc = parser.parse(wrapper);

            // Extract content as a slice (skip the doc wrapper node)
            const slice = new Slice(doc.content, 0, 0);

            const { tr } = view.state;
            const { from, to } = tr.selection;
            tr.replaceRange(from, to, slice);
            view.dispatch(tr.scrollIntoView());

            event.preventDefault();
            return true;
          },
        },
      }),
    ];
  },
});
