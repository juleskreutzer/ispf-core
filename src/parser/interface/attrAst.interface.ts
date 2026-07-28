import type { AttrKeyword } from '../../lexer/index.ts';
import type { AstNodeType } from '../enum/index.ts';
import type { AstNode } from './index.ts';

export interface AttributeDefinitionNode extends AstNode {
    type: AstNodeType.AttributeDefinition;
    attributeChar: string;
    options: AttributeOptionNode[];
}

export interface AttributeOptionNode extends AstNode {
    type: AstNodeType.AttributeOption;
    keyword: AttrKeyword;
    value?: string | undefined;
}