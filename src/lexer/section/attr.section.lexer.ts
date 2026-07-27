import { createErrorToken } from '../diagnostic.ts';
import { AttrKeyword } from '../enum/attrKeyword.enum.ts';
import { TokenType } from '../enum/index.ts';
import type { Token } from '../interface/index.ts';
import { SectionLexer } from '../section.lexer.ts';

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=section-formatting-attribute-statements
const VALID_ATTRIBUTE_CHAR = /^[@#$%~^*!+_\-]$/;

export class AttrSectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = []

        this.lines.forEach((line, i) => {
            const lineNumber = this.startLine + i;

            const trimmed = line.trim();

            if (!trimmed) return;

            const attributeChar = trimmed[0]

            if(!VALID_ATTRIBUTE_CHAR.test(attributeChar!)) {
                tokens.push(createErrorToken(
                    "Invalid attribute character",
                    lineNumber,
                    0,
                    attributeChar
                ));

                return;
            }

            tokens.push({
                type: TokenType.AttributeChar,
                value: attributeChar!,
                location: {
                    line: lineNumber,
                    column: line.indexOf(attributeChar!),
                    length: 1
                }
            });

            const content = trimmed.substring(1);

            this.scanKeywords(content, lineNumber, line.indexOf(attributeChar!) + 1, tokens);
        });

        return tokens;
    }

    private scanKeywords(input: string, line: number, offset: number, tokens: Token[]) {
        const regex = /([A-Z]+)(?:\(([^)]*)\))?/gi;

        for (const match of input.matchAll(regex)) {
            const keyword = match[1]!.toUpperCase()
            const enumValue = AttrKeyword[keyword as keyof typeof AttrKeyword]

            if (!enumValue) {
                tokens.push(
                    createErrorToken(`Unknown attribute keyword '${keyword}'`, line, offset + match.index!, keyword)
                );
                continue;
            }

            tokens.push({
                type: TokenType.AttributeKeyword,
                keyword: enumValue,
                location: {
                    line,
                    column: offset + match.index!,
                    length: keyword.length
                }
            });

            if (match[2] !== undefined) {
                tokens.push({
                    type: TokenType.AttributeValue,
                    value: match[2],
                    location: {
                        line, 
                        column: offset + match.index! + keyword.length + 1,
                        length: match[2].length
                    }
                });
            }
        }
    }
}