import { Node, mergeAttributes } from "@tiptap/core";

export interface CalloutOptions {
  HTMLAttributes: Record<string, string>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: () => ReturnType;
      toggleCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      emoji: {
        default: "💡",
        parseHTML: (element) => element.getAttribute("data-emoji") || "💡",
        renderHTML: (attributes) => ({
          "data-emoji": attributes.emoji,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "callout",
        "class": "callout flex gap-3 rounded-md border border-border bg-muted/50 p-4 my-2",
      }),
      [
        "span",
        {
          class: "callout-emoji select-none text-lg leading-none mt-0.5",
          contenteditable: "false",
        },
        HTMLAttributes["data-emoji"] || "💡",
      ],
      ["div", { class: "callout-content flex-1 min-w-0" }, 0],
    ];
  },

  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
      toggleCallout:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, "paragraph"),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-c": () => this.editor.commands.toggleCallout(),
    };
  },
});
