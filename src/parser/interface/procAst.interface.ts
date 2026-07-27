import type { ProcKeyword } from '../../lexer/index.ts';
import type { AstNodeType } from '../enum/astNode.enum.ts';
import type { AstNode, ProcExpressionNode } from './index.ts';

export interface ProcStatementNode extends AstNode {
    type: AstNodeType.ProcStatement;
    command?: ProcKeywordNode | IdentifierNode | undefined;
    argument: ProcExpressionNode[];
}

export interface ProcKeywordNode extends AstNode {
    type: AstNodeType.ProcKeyword;
    keyword: ProcKeyword | string;
}

export interface IdentifierNode extends AstNode {
    type: AstNodeType.Identifier;
    name: string;
}

export interface StringLiteralNode extends AstNode {
    type: AstNodeType.StringLiteral;
    value: string;
}

export interface NumberLiteralNode extends AstNode {
    type: AstNodeType.NumberLiteral;
    value: string;
}

export interface OperatorNode extends AstNode {
    type: AstNodeType.Operator;
    value: string;
}

export interface CommentNode extends AstNode {
    type: AstNodeType.Comment;
    value: string;
}

export interface TextNode extends AstNode {
    type: AstNodeType.Text
    value: string;
}

export interface ErrorNode extends AstNode {
    type: AstNodeType.Error;
    message: string;
    value?: string | undefined;
}