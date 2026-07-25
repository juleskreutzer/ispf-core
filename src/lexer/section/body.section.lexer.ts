import { TokenType } from "../enum/index.ts";
import type { Token } from "../interface/index.ts";
import { SectionLexer } from "../section.lexer.ts";

const variableRegex = /&[A-Z0-9#$@]+/ig;

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=sections-defining-body-section

export class BodySectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = [];

        this.lines.forEach((line, i) => {
            let last = 0;

            for (const match of line.matchAll(variableRegex)) {
                if (match.index! > last) {
                    tokens.push({
                        type: TokenType.Text,
                        value: line.substring(last, match.index),
                        line: this.startLine + i,
                        column: last
                    });
                }

                tokens.push({
                    type: TokenType.Variable,
                    value: match[0],
                    line: this.startLine + i,
                    column: match.index!
                });

                last = match.index! + match[0].length
            }

            if (last < line.length) {
                tokens.push({
                    type: TokenType.Text,
                    value: line.substring(last),
                    line: this.startLine + i,
                    column: last
                });
            }
        });

        return tokens;
    }
}