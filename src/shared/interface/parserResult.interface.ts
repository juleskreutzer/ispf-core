import type { PanelAst } from '../../parser/index.ts';
import type { Diagnostic } from './diagnostic.interface.ts';

export interface ParserResult {
    ast: PanelAst;
    diagnostics: Diagnostic[];
}