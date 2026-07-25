import { TokenType } from "../enum/index.ts";
import type { Token } from "../interface/index.ts";
import { SectionLexer } from "../section.lexer.ts";

const regex = /(&[A-Z0-9#$@]+)|([A-Z]+)|(\d+)|([(),=])|('[^']*')/ig;

// Using https://www.ibm.com/docs/en/zos/3.2.0?topic=sections-defining-processing-section

export class ProcSectionLexer extends SectionLexer {
    lex(): Token[] {
        const tokens: Token[] = [];

        this.lines.forEach((line, i) => {
            for (const m of line.matchAll(regex)) {
                let type = TokenType.Text;

                if (m[1]) type = TokenType.Variable
                else if (m[2]) type = TokenType.Keyword
                else if (m[3]) type = TokenType.Number
                else if (m[4]) type = TokenType.Operator
                else if (m[5]) type = TokenType.String

                tokens.push({
                    type: type,
                    value: m[0],
                    line: this.startLine + i,
                    column: m.index!
                });
            }
        });

        return tokens;
    }

}