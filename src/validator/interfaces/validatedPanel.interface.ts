import type { AttributeDefinitionNode, PanelAst, VariableReferenceNode, VerStatementNode } from "../../parser/index.ts";
import type { Diagnostic } from "../../shared/index.ts";

export interface ValidatedPanel {
    ast: PanelAst;
    diagnostics: Diagnostic[];
    body: ValidatedBodyInfo;
}

export interface ValidatedBodyInfo {
    attributes: Map<string, AttributeDefinitionNode>;
    variables: Map<string, VariableReferenceNode>;
    checks: Map<string, VerStatementNode>;
}