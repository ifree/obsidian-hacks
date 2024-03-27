import {
	App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, renderMath,
	loadMathJax
} from 'obsidian';

import { texPlugin, TexBlockPostProcessor } from 'src/observablehq';

export default class ObsidianHacks extends Plugin {

	async onload() {

		// observablehq format handling ${tex/tex.block}, ```tex 
		this.registerMarkdownCodeBlockProcessor("tex", TexBlockPostProcessor)
		this.registerEditorExtension([texPlugin]);

	}

	onunload() {

	}


}



