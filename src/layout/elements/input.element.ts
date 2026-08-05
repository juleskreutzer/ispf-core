import { AstNodeType } from '../../parser/index.ts';
import { ElementType } from '../interface/index.ts';
import { BaseElement } from './base.element.ts';
import type {ElementLayout, IInputElement } from '../interface/index.ts';
import type { AttributeDefinitionNode, BodyContentNode } from '../../parser/index.ts';

export class InputElement extends BaseElement {
    constructor(attr: AttributeDefinitionNode, element: BodyContentNode) {
        super(attr, element);
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
            length: this.element.type === AstNodeType.VariableReference ? this.element.fieldLength ?? 0 : 0,
        }
    }
}