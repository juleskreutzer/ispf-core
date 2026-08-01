import type { Token } from '../lexer/index.ts';
import type { DiagnosticSeverity, Diagnostic, DiagnosticOrigin } from '../shared/index.ts';

/**
 * Creates a parser diagnostic object for a token-related issue.
 *
 * @param message The diagnostic message.
 * @param token The token that triggered the issue.
 * @param severity The severity of the diagnostic.
 * @param origin The component that reported the diagnostic.
 * @returns A structured diagnostic object.
 */
export function createParserDiagnostic(message: string, token: Token, severity: DiagnosticSeverity = 'error', origin: DiagnosticOrigin): Diagnostic {
    return {
        message,
        severity,
        origin,
        location: token.location,
        token
    }
}