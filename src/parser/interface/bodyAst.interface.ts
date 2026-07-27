import type { AstNodeType } from '../enum/index.ts'; 
import type { AstNode, BodyContentNode } from './index.ts';

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
}

export interface VariableReferenceNode extends AstNode {
    type: AstNodeType.VariableReference;
    value: string;
}
