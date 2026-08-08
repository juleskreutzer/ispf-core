import { AstNodeType } from '../../parser/index.ts';
import type { AttrKeyword, SourceLocation } from '../../lexer/index.ts';
import type { Diagnostic, DiagnosticSeverity } from '../../shared/index.ts';
import type { ElementLayout } from '../interface/index.ts';
import type { AttributeDefinitionNode, AttributeOptionNode, BodyContentNode, ErrorNode, VerStatementNode } from '../../parser/index.ts';

export abstract class BaseElement {
    private _attr: AttributeDefinitionNode;
    private _element: BodyContentNode;
    private _diagnostics: Diagnostic[];
    private _checks: Map<string, VerStatementNode> | undefined;

    constructor(attr: AttributeDefinitionNode, element: BodyContentNode, checks?: Map<string, VerStatementNode>) {
        this._attr = attr;
        this._element = element;

        this._diagnostics = [];

        if (checks) this._checks = checks;
    }

    get attr(): AttributeDefinitionNode {
        return this._attr;
    }

    get element(): BodyContentNode {
        return this._element;
    }

    get diagnostics(): Diagnostic[] {
        return this._diagnostics;
    }

    abstract create(): ElementLayout;

    protected findAttributeOptions(keyword: AttrKeyword): AttributeOptionNode | ErrorNode | undefined {
        return this.attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === keyword);
    }

    protected getAttributeOptionValue(keyword: AttrKeyword, toUpper: boolean = false): string | undefined {
        const option = this.findAttributeOptions(keyword);
        if (!option?.value) return undefined;
        return toUpper ? option.value.toUpperCase() : option.value;
    }

    protected createDiagnostic(message: string, severity: DiagnosticSeverity = 'error', location?: SourceLocation | undefined): Diagnostic {
        const diag: Diagnostic = {
            message: message,
            severity: severity,
            origin: 'LAYOUT',
            location: location
        }

        this._diagnostics.push(diag);
        return diag;
    }

    protected getCheck(): VerStatementNode | undefined {
        if (!this._checks) return undefined;

        const variable = this._element.value;

        if (!variable) return undefined;
        return this._checks.get(variable.toUpperCase());
    }
}