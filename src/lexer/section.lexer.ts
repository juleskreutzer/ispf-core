import type { Token } from './interface/index.ts';

export abstract class SectionLexer {
    constructor(protected readonly lines: string[], protected readonly startLine: number) {}

    abstract lex(): Token[];
}