import { TokenType } from '../enum/index.ts';
import { SectionLexer } from '../section.lexer.ts';
import type { Token } from '../interface/index.ts';

/**
 * @class GenericSectionLexer
 * 
 * This is a fallback lexer class
 */
export class GenericSectionLexer extends SectionLexer {

    /**
     * Generic lexer returning the complete line as Text token
     * @returns lex 
     */
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