import type { SourceLocation, Token } from '../../lexer/index.ts';
import type { DiagnosticSeverity } from '../type/index.ts';

export interface Diagnostic {
    message: string;
    severity: DiagnosticSeverity;
    location?: SourceLocation | undefined;
    token?: Token | undefined;
}