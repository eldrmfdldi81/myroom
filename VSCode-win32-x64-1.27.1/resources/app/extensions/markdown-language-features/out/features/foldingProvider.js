"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const tableOfContentsProvider_1 = require("../tableOfContentsProvider");
const rangeLimit = 5000;
class MarkdownFoldingProvider {
    constructor(engine) {
        this.engine = engine;
    }
    async getRegions(document) {
        const isStartRegion = (t) => /^\s*<!--\s*#?region\b.*-->/.test(t);
        const isEndRegion = (t) => /^\s*<!--\s*#?endregion\b.*-->/.test(t);
        const isRegionMarker = (token) => token.type === 'html_block' &&
            (isStartRegion(token.content) || isEndRegion(token.content));
        const tokens = await this.engine.parse(document.uri, document.getText());
        const regionMarkers = tokens.filter(isRegionMarker)
            .map(token => ({ line: token.map[0], isStart: isStartRegion(token.content) }));
        const nestingStack = [];
        return regionMarkers
            .map(marker => {
            if (marker.isStart) {
                nestingStack.push(marker);
            }
            else if (nestingStack.length && nestingStack[nestingStack.length - 1].isStart) {
                return new vscode.FoldingRange(nestingStack.pop().line, marker.line, vscode.FoldingRangeKind.Region);
            }
            else {
                // noop: invalid nesting (i.e. [end, start] or [start, end, end])
            }
            return null;
        })
            .filter((region) => !!region);
    }
    async provideFoldingRanges(document, _, _token) {
        const [regions, sections] = await Promise.all([this.getRegions(document), this.getHeaderFoldingRanges(document)]);
        return [...regions, ...sections].slice(0, rangeLimit);
    }
    async getHeaderFoldingRanges(document) {
        const tocProvider = new tableOfContentsProvider_1.TableOfContentsProvider(this.engine, document);
        const toc = await tocProvider.getToc();
        return toc.map(entry => {
            let endLine = entry.location.range.end.line;
            if (document.lineAt(endLine).isEmptyOrWhitespace && endLine >= entry.line + 1) {
                endLine = endLine - 1;
            }
            return new vscode.FoldingRange(entry.line, endLine);
        });
    }
}
exports.default = MarkdownFoldingProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/5944e81f3c46a3938a82c701f96d7a59b074cfdc/extensions\markdown-language-features\out/features\foldingProvider.js.map
