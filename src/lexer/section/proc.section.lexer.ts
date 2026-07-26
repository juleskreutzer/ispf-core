import { createErrorToken } from '../diagnostic.ts';
import { ProcKeyword, TokenType } from '../enum/index.ts';
import type { Token } from '../interface/index.ts';
import { SectionLexer } from '../section.lexer.ts';

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=sections-defining-processing-section
const VARIABLE_REGEX = /^&[A-Z0-9]+/i;
const IDENTIFIER_REGEX = /^[A-Z][A-Z0-9_-]*/i;
const OPERATOR_REGEX = /^(=|<>|<=|>=|<|>|\+|-|\*|\/)/;

export class ProcSectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = [];

        this.lines.forEach((line, i) => {
            this.scanLine(line, this.startLine + i, tokens);
        });

        return tokens;
    }

    private scanLine(line: string, lineNumber: number, tokens: Token[]) {
        let position = 0;

        while (position < line.length) {
            const remaining = line.substring(position);

            /* Check for space */
            if (/\s/.test(remaining[0]!)) {
                position++
                continue;
            }

            /* Check for comment */
            if (remaining.startsWith('/*')) {
                tokens.push({
                    type: TokenType.Comment,
                    value: remaining,
                    location: {
                        line: lineNumber,
                        column: position,
                        length: remaining.length
                    }
                });

                return;
            }

            /* Check for strings */
            if (remaining[0] === "'") {
                const end = remaining.indexOf("'",1);
                if (end !== -1) {
                    const value = remaining.substring(0, end + 1);

                    tokens.push({
                        type: TokenType.Text,
                        value: value,
                        location: {
                            line: lineNumber,
                            column: position,
                            length: value.length
                        }
                    });

                    position += value.length;

                    continue;
                }
            }

            /* Check for variables */
            const variable = remaining.match(VARIABLE_REGEX);

            if(variable) {
                tokens.push({
                    type:TokenType.Variable,
                    value:variable[0],
                    location:{
                        line:lineNumber,
                        column:position,
                        length:variable[0].length
                    }
                });

                position += variable[0].length;
                continue;
            }

            /* Check for operators */
            const operator = remaining.match(OPERATOR_REGEX);

            if(operator) {
                tokens.push({
                    type:TokenType.Operator,
                    value:operator[0],
                    location:{
                        line:lineNumber,
                        column:position,
                        length:operator[0].length
                    }
                });

                position += operator[0].length;
                continue;
            }

            /* Check for numbers */
            const number = remaining.match(/^\d+/);

            if(number) {
                tokens.push({
                    type:TokenType.Number,
                    value:number[0],
                    location:{
                        line:lineNumber,
                        column:position,
                        length:number[0].length
                    }
                });

                position += number[0].length;
                continue;
            }

            /* Check for identifiers */
            const identifier = remaining.match(IDENTIFIER_REGEX);

            if(identifier) {
                const word = identifier[0].toUpperCase();

                const type = ProcKeyword[word as keyof typeof ProcKeyword] ? TokenType.ProcKeyword : TokenType.Identifier;

                tokens.push({
                    type,
                    value:word,
                    location:{
                        line:lineNumber,
                        column:position,
                        length:word.length
                    }
                });

                position += word.length;
                continue;
            }

            /* Unknown character */
            tokens.push(
                createErrorToken(
                    `Unexpected character '${remaining[0]}'`,
                    lineNumber,
                    position,
                    remaining[0]
                )
            );

            position++;
        }
    }
}