import type { Token } from '../lexer/index.ts';
import type { DiagnosticSeverity, Diagnostic, DiagnosticOrigin } from '../shared/index.ts';

export function createParserDiagnostic(message: string, token: Token, severity: DiagnosticSeverity = 'error', origin: DiagnosticOrigin): Diagnostic {
    return {
        message,
        severity,
        origin,
        location: token.location,
        token
    }
}