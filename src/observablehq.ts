import { renderMath, loadMathJax, MarkdownPostProcessorContext } from 'obsidian';

import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder, } from "@codemirror/state";
import {
    Decoration,
    DecorationSet,
    PluginSpec,
    PluginValue,
    ViewUpdate,
    ViewPlugin,
    EditorView,
    WidgetType,
} from "@codemirror/view";

export function TexBlockPostProcessor(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext){
    loadMathJax().then(() => {
        el.appendChild(renderMath(source, true));
    });
}

export class TexWidget extends WidgetType {
    text: string;
    isInline: boolean;
    constructor(text: string, inline: boolean) {
        super();
        this.text = text;
        this.isInline = inline;
    }
    toDOM(view: EditorView): HTMLElement {
        const div = document.createElement("span");
        div.setAttribute('class', 'math');

        // wait mathjax to render
        loadMathJax().then(() => {
            div.appendChild(renderMath(this.text, !this.isInline));
        });

        //return renderMath(this.text, true)
        return div;
    }
}


class TexPlugin implements PluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    destroy() { }

    //TODO: live preview
    buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        for (let { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node) {
                    // node.type.id: 14, 15, node.type.name: *inline-code
                    if (node.type.name === 'inline-code') {
                        if(node.from == node.to) return;
                        const line = view.state.doc.lineAt(node.from);
                        const before = view.state.doc.sliceString(line.from, node.from);
                        const after = view.state.doc.sliceString(node.to, line.to);
                        
                        // look back ${`<inline-code>`}
                        const prefix_regex = /\$\{\s*(tex(\.block)?)`/g
                        const suffix_regex = /^`\s*\}/g

                        // find the last match
                        let prefix_match;
                        let last_prefix_match;
                        while ((prefix_match = prefix_regex.exec(before)) != null) {
                            last_prefix_match = prefix_match;
                        }

                        let suffix_match = suffix_regex.exec(after);
                        if (last_prefix_match && suffix_match) {
                            const match_len = last_prefix_match[0].length;
                            const suffix_len = suffix_match[0].length;
                            const isInline = last_prefix_match[1] === 'tex';

                            builder.add(
                                node.from - match_len,
                                node.to + suffix_len,
                                Decoration.replace({
                                    widget: new TexWidget(view.state.doc.slice(node.from, node.to)?.toString(), isInline),
                                })
                            );
                        }
                    }
                },
            });
        }

        return builder.finish();
    }
}

const pluginSpec: PluginSpec<TexPlugin> = {
    decorations: (value: TexPlugin) => value.decorations,
};

export const texPlugin = ViewPlugin.fromClass(
    TexPlugin,
    pluginSpec
);