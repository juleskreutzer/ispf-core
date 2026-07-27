import type { SourceLocation, Token } from '../../lexer/index.ts';

export type ParserDiagnosticSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'trace';

export interface ParserDiagnostic {
    message: string;
    severity: ParserDiagnosticSeverity;
    location: SourceLocation;
    token?: Token | undefined;
}