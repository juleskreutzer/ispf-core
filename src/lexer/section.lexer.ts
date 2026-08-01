import type { Token } from './interface/index.ts';

/**
 * @class SectionLexer
 * @abstract
 * 
 * Skeleton class for separate section lexers
 */
export abstract class SectionLexer {
    constructor(protected readonly lines: string[], protected readonly startLine: number) {}

    abstract lex(): Token[];
}