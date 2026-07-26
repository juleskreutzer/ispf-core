import { SectionType } from './enum/index.ts';
import type { Token } from './interface/index.ts';
import { AttrSectionLexer, BodySectionLexer, GenericSectionLexer, ProcSectionLexer } from './section/index.ts';
import * as fs from 'fs'

export class PanelLexer {

    lexFile(source: string, options: { encoding: BufferEncoding | undefined, flag: string | undefined}): Token[] {
        if(fs.existsSync(source)) {
            const data = fs.readFileSync(source, { encoding: (options && options.encoding) ?? 'utf8', flag: (options && options.flag) ?? undefined})
            return this.lex(data);
        } else {
            throw Error(`Unable to resolve '${source}'`)
        }
    }

    lex(source: string): Token[] {
        const lines = source.split(/\r?\n/);

        const tokens: Token[] = [];

        let currentSection = SectionType.UNKNOWN
        let currentLines: string[] = [];
        let startLine = 0;

        const flush = () => {

            if (!currentLines.length)
                return;

            switch (currentSection) {

                case 'ATTR':
                    tokens.push(...new AttrSectionLexer(currentLines, startLine).lex());
                    break;

                case 'BODY':
                    tokens.push(...new BodySectionLexer(currentLines, startLine).lex());
                    break;

                case 'PROC':
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