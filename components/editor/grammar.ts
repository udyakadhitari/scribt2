import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const GrammarChecker = Extension.create({
  name: "grammarChecker",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("grammarChecker"),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldSet) {
            // Map the old decorations through the document transaction edits
            let set = oldSet.map(tr.mapping, tr.doc);

            // Handle setting new grammar highlights
            const errors = tr.getMeta("setGrammarErrors");
            if (errors) {
              const decs = errors.map((err: any) => {
                return Decoration.inline(err.from, err.to, {
                  class: "grammar-error",
                  style: "background-color: rgba(254, 240, 138, 0.6); border-bottom: 2px wavy #eab308; cursor: pointer;",
                  "data-error-id": err.id,
                });
              });
              set = DecorationSet.create(tr.doc, decs);
            }

            // Handle clearing errors
            const clear = tr.getMeta("clearGrammarErrors");
            if (clear) {
              set = DecorationSet.empty;
            }

            return set;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
