import type { SectionType, SourceLocation } from '../../lexer/index.ts';
import type { AstNodeType } from '../enum/index.ts';
import type { AttributeDefinitionNode, BinaryExpressionNode, BodyAttributeReferenceNode, BodyLineNode, BodyTextNode, CommentNode, ErrorNode, FunctionCallExpressionNode, IdentifierNode, NumberLiteralNode, OperatorNode, ProcKeywordNode, ProcStatementNode, StringLiteralNode, TextNode, UnaryExpressionNode, VariableReferenceNode } from './index.ts';

export interface AstNode {
    type: AstNodeType;
    location?: SourceLocation | undefined;
}

export interface PanelAst extends AstNode {
    type: AstNodeType.Panel;
    sections: SectionAst[];
}

export interface SectionAst extends AstNode {
    type: AstNodeType.Section;
    sectionType: SectionType;
    name: string;
    statements: SectionStatement[];
}

export type SectionStatement = 
    | AttributeDefinitionNode
    | BodyLineNode
    | ProcStatementNode
    | TextNode
    | CommentNode 
    | ErrorNode;

export type ProcExpressionNode = 
    | BinaryExpressionNode
    | UnaryExpressionNode
    | FunctionCallExpressionNode
    | ProcKeywordNode
    | IdentifierNode
    | VariableReferenceNode
    | StringLiteralNode
    | NumberLiteralNode
    | OperatorNode
    | TextNode
    | CommentNode
    | ErrorNode;

export type BodyContentNode =
    | BodyTextNode
    | BodyAttributeReferenceNode
    | VariableReferenceNode