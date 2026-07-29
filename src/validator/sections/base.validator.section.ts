import type { SourceLocation, Token } from '../../lexer/index.ts';
import type { AttributeDefinitionNode, SectionAst } from '../../parser/index.ts';
import type { Diagnostic, DiagnosticSeverity, ValidatorResult } from '../../shared/index.ts';

export abstract class BaseValidator {
    private validatorDiagnostics: Diagnostic[]
    private readonly _section: SectionAst;
    private readonly _attributes: Map<string, AttributeDefinitionNode> | undefined;

    constructor(section: SectionAst, attributes?: Map<string, AttributeDefinitionNode>) {
        this.validatorDiagnostics = [];
        this._section = section;
        this._attributes = attributes;
    }

    abstract validate(): ValidatorResult

    protected get diagnostics() {
        return this.validatorDiagnostics;
    }

    protected get section() {
        return this._section;
    }

    protected get attributes() {
        return this._attributes;
    }

    protected createDiagnostic(message: string, severity: DiagnosticSeverity = 'error', location?: SourceLocation | undefined, token?: Token | undefined) {
        const diag = {
            message,
            severity,
            location,
            token
        }

        this.validatorDiagnostics.push(diag);
        return diag;
    }



}