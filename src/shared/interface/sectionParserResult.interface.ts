import type { SectionStatement } from "../../parser/index.ts";
import type { Diagnostic } from "./diagnostic.interface.ts";

export interface SectionParserResult {
    section: SectionStatement[];
    diagnostics: Diagnostic[];
}