import { AstNodeType, type AttributeDefinitionNode, type BodyContentNode, type VerStatementNode } from "../../parser/index.ts";
import { ElementType, type ElementLayout } from "../interface/index.ts";
import { BaseElement } from "./base.element.ts";

export class SelectionElement extends BaseElement {
    constructor(attr: AttributeDefinitionNode, element: BodyContentNode, checks: Map<string, VerStatementNode>) {
        super(attr, element, checks);
    }

    create(): ElementLayout {
        return {
            type: ElementType.SELECTION,
            id: this.element.type === AstNodeType.VariableReference ? this.element.value : '',
            values: this.createValues(),
            required: this.createRequired(),
            length: 0
        }
    }

    private createValues(): string[] {
        const checkMatch = this.getCheck();

        if (!checkMatch) return [];

        if (checkMatch.command.type === AstNodeType.ProcKeyword && checkMatch.command.keyword === 'VER') {
            const params = checkMatch.parameters.find(v => v.type === 'LIST');
            if (!params) return []

            return params.values ?? [];
        }

        return [];
    }

    private createRequired(): boolean {
        const checkMatch = this.getCheck();

        if (!checkMatch) return false;

        if (checkMatch.command.type === AstNodeType.ProcKeyword && checkMatch.command.keyword === 'VER') {
            return checkMatch.hasNonblank ?? false;
        }

        return false;
    }
}