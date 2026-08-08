import { AstNodeType } from '../../parser/index.ts';
import { ElementType } from '../interface/index.ts';
import { BaseElement } from './base.element.ts';
import type {ElementLayout, IInputElement } from '../interface/index.ts';
import type { AttributeDefinitionNode, BodyContentNode, VerStatementNode } from '../../parser/index.ts';
import { pictToRegex } from '../../shared/defaultFunctions.ts';

export class InputElement extends BaseElement {

    constructor(attr: AttributeDefinitionNode, element: BodyContentNode, checks: Map<string, VerStatementNode>) {
        super(attr, element, checks);
    }

    /**
     * Create the `ElementLayout` that represents the current node
     * 
     * see {@link IInputElement} for possible properties that can be filled
     *
     * @return {*}  {ElementLayout}
     * @memberof InputElement
     */
    create(): ElementLayout {
        return {
            type: ElementType.INPUT,
            id: this.element.type === AstNodeType.VariableReference ? this.element.value : '',
            length: this.createLength(),
            pattern: this.createPattern(),
            required: this.createRequired()
        }
    }

    private createLength(): number {
        switch (this.element.type) {
            case AstNodeType.VariableReference:
                return this.element.fieldLength ?? 0;
            default:
                return this.element.value?.length ?? 0;
        }
    }

    private createPattern(): string {
        const checkMatch = this.getCheck();

        if (!checkMatch) return ''; // No check for this variable

        if (checkMatch.command.type === AstNodeType.ProcKeyword && checkMatch.command.keyword === 'VER') {
            const param = checkMatch.parameters.find(v => v.type === 'PICT');
            if (!param) return '';
            if (!param.value || param.value.length < 1) return '';

            return pictToRegex(param.value);
        }

        return '';
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