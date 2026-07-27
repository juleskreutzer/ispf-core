import type { AstNodeType } from '../enum/index.ts'; 
import type { AstNode, AttributeDefinitionNode, BodyContentNode } from './index.ts';

export interface BodyLineNode extends AstNode {
    type: AstNodeType.BodyLine;
    content: BodyContentNode[];
}

export interface BodyTextNode extends AstNode {
    type: AstNodeType.BodyText;
    value: string;
}

export interface BodyAttributeReferenceNode extends AstNode {
    type: AstNodeType.BodyAttributeReference;
    value: string;
    attribute?: AttributeDefinitionNode | undefined;
}

export interface VariableReferenceNode extends AstNode {
    type: AstNodeType.VariableReference;
    value: string;
    fieldLength?: number | undefined;
}
