"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const slugify_1 = require("./slugify");
class TableOfContentsProvider {
    constructor(engine, document) {
        this.engine = engine;
        this.document = document;
    }
    async getToc() {
        if (!this.toc) {
            try {
                this.toc = await this.buildToc(this.document);
            }
            catch (e) {
                this.toc = [];
            }
        }
        return this.toc;
    }
    async lookup(fragment) {
        const toc = await this.getToc();
        const slug = slugify_1.githubSlugifier.fromHeading(fragment);
        return toc.find(entry => entry.slug.equals(slug));
    }
    async buildToc(document) {
        const toc = [];
        const tokens = await this.engine.parse(document.uri, document.getText());
        for (const heading of tokens.filter(token => token.type === 'heading_open')) {
            const lineNumber = heading.map[0];
            const line = document.lineAt(lineNumber);
            toc.push({
                slug: slugify_1.githubSlugifier.fromHeading(line.text),
                text: TableOfContentsProvider.getHeaderText(line.text),
                level: TableOfContentsProvider.getHeaderLevel(heading.markup),
                line: lineNumber,
                location: new vscode.Location(document.uri, line.range)
            });
        }
        // Get full range of section
        return toc.map((entry, startIndex) => {
            let end = undefined;
            for (let i = startIndex + 1; i < toc.length; ++i) {
                if (toc[i].level <= entry.level) {
                    end = toc[i].line - 1;
                    break;
                }
            }
            const endLine = typeof end === 'number' ? end : document.lineCount - 1;
            return Object.assign({}, entry, { location: new vscode.Location(document.uri, new vscode.Range(entry.location.range.start, new vscode.Position(endLine, document.lineAt(endLine).range.end.character))) });
        });
    }
    static getHeaderLevel(markup) {
        if (markup === '=') {
            return 1;
        }
        else if (markup === '-') {
            return 2;
        }
        else { // '#', '##', ...
            return markup.length;
        }
    }
    static getHeaderText(header) {
        return header.replace(/^\s*#+\s*(.*?)\s*#*$/, (_, word) => word.trim());
    }
}
exports.TableOfContentsProvider = TableOfContentsProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/5944e81f3c46a3938a82c701f96d7a59b074cfdc/extensions\markdown-language-features\out/tableOfContentsProvider.js.map
