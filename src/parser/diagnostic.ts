import type { Token } from '../lexer/index.ts';
import type { DiagnosticSeverity, Diagnostic } from '../shared/index.ts';

export function createParserDiagnostic(message: string, token: Token, severity: DiagnosticSeverity = 'error'): Diagnostic {
    return {
        message,
        severity,
        location: token.location,
        token
    }
}