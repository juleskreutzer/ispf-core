import { SectionType, TokenType } from './enum/index.ts';
import { AttrSectionLexer, BodySectionLexer, GenericSectionLexer, ProcSectionLexer } from './section/index.ts';
import type { Token } from './interface/index.ts';
import * as fs from 'fs'

/**
 * @class PanelLexer
 * 
 * This class lexes a panel based on either a file path or the raw panel data. It is used as input for further processing of the panel (e.g parsing, validation, layout generation)
 */
export class PanelLexer {

    /**
     * Lexs file
     * @param source path to the panel source file
     * @param options optional encoding and flag options, see {@link node:fs}
     * @returns Token[]
     * 
     * @remark
     * Calls {@link lex()} internally
     */
    lexFile(source: string, options: { encoding: BufferEncoding | undefined, flag: string | undefined}): Token[] {
        if(fs.existsSync(source)) {
            const data = fs.readFileSync(source, { encoding: (options && options.encoding) ?? 'utf8', flag: (options && options.flag) ?? undefined})
            return this.lex(data);
        } else {
            throw Error(`Unable to resolve '${source}'`)
        }
    }

    /**
     * Lexs the raw source of a panel definition
     * @param source Panel source
     * @returns Token[]
     */
    lex(source: string): Token[] {
        const lines = source.split(/\r?\n/);

        const tokens: Token[] = [];

        let currentSection = SectionType.UNKNOWN
        let currentLines: string[] = [];
        let startLine = 0;

        const flush = () => {

            if (!currentLines.length)
                return;

            tokens.push({
                type: TokenType.SectionStart,
                value: currentSection,
                location: {
                    line: startLine - 1,
                    column: 0,
                    length: currentLines.length
                }
            });

            // Each supported section has its own lexer
            switch (currentSection) {
                case SectionType.ATTR:
                    tokens.push(...new AttrSectionLexer(currentLines, startLine).lex());
                    break;
                case SectionType.BODY:
                    tokens.push(...new BodySectionLexer(currentLines, startLine).lex());
                    break;
                case SectionType.PROC:
                    tokens.push(...new ProcSectionLexer(currentLines, startLine).lex());
                    break;
                default:
                    tokens.push(...new GenericSectionLexer(currentLines, startLine).lex());

            }

            currentLines = [];
        };

        lines.forEach((line, i) => {

            const match = /^\)([A-Z0-9]+)/i.exec(line);

            if (match) {

                flush();

                const name = match[1]!.toUpperCase();

                currentSection = Object.values(SectionType).includes(name as SectionType) ? name as SectionType : SectionType.UNKNOWN
                startLine = i + 1;

                return;
            }

            currentLines.push(line);

        });

        flush();

        return tokens;
    }
}