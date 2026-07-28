import type { SectionType, TokenType } from '../enum/index.ts';
import type { SourceLocation } from './index.ts';
import type { AttrCharToken, AttrKeywordToken, AttrValueToken, BodyAttributeReferenceToken, ProcCommandToken, ProcKeywordToken } from './token/index.ts';

export interface BaseToken {
    type: TokenType;
    value?: string | undefined;
    location: SourceLocation
}

export interface SectionStartToken extends BaseToken {
    type: TokenType.SectionStart;
    value: SectionType;
}

export interface VariableToken extends BaseToken {
    type: TokenType.Variable;
    value: string;
}

export interface OperatorToken extends BaseToken {
    type: TokenType.Operator;
    value: string;
}

export interface NumberToken extends BaseToken {
    type: TokenType.Number;
    value: string;
}

export interface IdentifierToken extends BaseToken {
    type: TokenType.Identifier;
    value: string;
}

export interface ErrorToken extends BaseToken {
    type: TokenType.Error;
    message: string;
}

export interface CommentToken extends BaseToken {
    type: TokenType.Comment;
    value: string
}

export interface NewLineToken extends BaseToken {
    type: TokenType.NewLine;
}

export interface EOFToken extends BaseToken {
    type: TokenType.EOF;
}

export interface TextToken extends BaseToken {
    type: TokenType.Text;
    value: string;
}

export interface StringToken extends BaseToken {
    type: TokenType.String;
    value: string;
}

export interface ParenthesisToken extends BaseToken {
    type: TokenType.Parenthesis;
    value: '(' | ')'
}

export type Token = 
    | SectionStartToken
    | AttrCharToken
    | AttrKeywordToken
    | AttrValueToken
    | BodyAttributeReferenceToken
    | ProcCommandToken
    | ProcKeywordToken
    | VariableToken
    | OperatorToken
    | NumberToken
    | IdentifierToken
    | ErrorToken
    | CommentToken
    | NewLineToken
    | EOFToken
    | TextToken
    | StringToken
    | ParenthesisToken;