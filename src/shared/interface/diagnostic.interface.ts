import type { SourceLocation, Token } from '../../lexer/index.ts';
import type { DiagnosticOrigin, DiagnosticSeverity } from '../type/index.ts';

export interface Diagnostic {
    message: string;
    severity: DiagnosticSeverity;
    origin: DiagnosticOrigin;
    location?: SourceLocation | undefined;
    token?: Token | undefined;
}