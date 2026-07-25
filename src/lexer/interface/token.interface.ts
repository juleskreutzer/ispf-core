import type { AttrKeyword, TokenType } from "../enum/index.ts";

export interface AttrCharToken {
    type: TokenType.AttributeChar,
    value: string;
    line: number;
    column: number;
}

export interface AttrKeywordToken {
    type: TokenType.Keyword;
    keyword: AttrKeyword;
    argument?: string;
    line: number;
    column: number;
}

export interface TextToken {
    type: TokenType.Text,
    value: string;
    line: number;
    column: number;
}

export type Token =
    | AttrCharToken
    | AttrKeywordToken
    | TextToken