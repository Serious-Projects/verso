import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { FileBlockView } from "../blocks/file-block-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileBlock: {
      setFileBlock: (options?: { url?: string; name?: string }) => ReturnType;
    };
  }
}

export const FileBlock = Node.create({
  name: "fileBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      name: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="file-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "file-block" }),
    ];
  },

  addCommands() {
    return {
      setFileBlock:
        (options = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { url: options.url ?? "", name: options.name ?? "" },
          }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileBlockView);
  },
});
