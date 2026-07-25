import { AttrKeyword } from "../enum/attrKeyword.enum.ts";
import { TokenType } from "../enum/index.ts";
import type { AttrKeywordToken, Token } from "../interface/index.ts";
import { SectionLexer } from "../section.lexer.ts";

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=section-formatting-attribute-statements

export class AttrSectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = [];

        this.lines.forEach((line, i) => {
            const trimmed = line.trim();

            if (!trimmed) return;

            tokens.push({
                type: TokenType.AttributeChar,
                value: trimmed[0]!,
                line: this.startLine + i,
                column: 1
            });

            const rest = trimmed.substring(1).trim();

            rest.split(/\s+/).forEach(word => {
                const match = word.match(/^([A-Z]+)(?:\((.*?)\))?$/i);

                if (!match) {
                    throw new Error(`Invalid attribute keyword: '${word}'`);
                }

                const key = AttrKeyword[match[1]!.toUpperCase() as keyof typeof AttrKeyword]

                tokens.push({
                    type: TokenType.Keyword,
                    keyword: key,
                    argument: match[2]!,
                    line: this.startLine + i,
                    column: 1
                });
            });
        });
        return tokens;
    }
}