import { TokenType } from '../enum/index.ts';
import type { Token } from '../interface/index.ts';
import { SectionLexer } from '../section.lexer.ts';

const VARIABLE_REGEX = /^&[A-Z][A-Z0-9]+/i;

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=sections-defining-body-section

export class BodySectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = [];

        this.lines.forEach((line, i) => {
            this.scanLine(line, this.startLine + i, tokens);

            tokens.push({
                type: TokenType.NewLine,
                location: {
                    line: this.startLine + i,
                    column: line.length,
                    length: 0
                }
            });
        });

        return tokens;
    }

    private scanLine(line: string, lineNumber: number, tokens: Token[]) {
        let position = 0;
        let textStart = 0;

        const flushText = (end:number) => {
            if (end > textStart) {
                tokens.push({
                    type: TokenType.Text,
                    value: line.substring(textStart, end),
                    location: {
                        line: lineNumber,
                        column: textStart,
                        length: end - textStart
                    }
                });
            }
        };

        while(position < line.length) {
            const current = line[position]!;
            
            /* Check attribute chars */
            if (/^[+@#$_-]$/.test(current)) {
                flushText(position);

                tokens.push({
                    type: TokenType.BodyAttributeReference,
                    value: current,
                    location: {
                        line: lineNumber,
                        column: position,
                        length: 1
                    }
                });

                position++
                textStart = position
                continue;
            }

            /* Check variables */
            const remaining = line.substring(position);
            const variable = remaining.match(VARIABLE_REGEX);

            if (variable) {
                flushText(position);
                
                tokens.push({
                    type: TokenType.Variable,
                    value: variable[0],
                    location: {
                        line: lineNumber,
                        column: position,
                        length: variable[0].length
                    }
                });

                position += variable[0].length;
                textStart = position;

                continue;
            }

            /* Check escaped & */
            if (current === "&" && line[position+1] === "&") {
                flushText(position);

                tokens.push({
                    type: TokenType.Text,
                    value: "&",
                    location: {
                        line: lineNumber,
                        column: position,
                        length: 2
                    }
                });

                position += 2;
                textStart = position;

                continue;
            }

            position++;
        }

        flushText(line.length);
    }
}