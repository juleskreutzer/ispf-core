import { TokenType } from '../enum/index.ts';
import { SectionLexer } from '../index.ts';
import type { Token } from '../interface/index.ts';

// Generic fallback lexer

export class GenericSectionLexer extends SectionLexer {
    lex(): Token[] {
        return this.lines.map((line, i) => ({
            type: TokenType.Text,
            value: line,
            location: {
                line: this.startLine + i,
                column: 0,
                length: line.length
            }
        }));
    }
}