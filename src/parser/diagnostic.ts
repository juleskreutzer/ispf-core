import type { Token } from '../lexer/index.ts';
import type { ParserDiagnostic, ParserDiagnosticSeverity } from './interface/index.ts';

export function createParserDiagnostic(message: string, token: Token, severity: ParserDiagnosticSeverity = 'error'): ParserDiagnostic {
    return {
        message,
        severity,
        location: token.location,
        token
    }
}