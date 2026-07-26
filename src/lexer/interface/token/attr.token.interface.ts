import type { BaseToken } from '../token.interface.ts';
import type { AttrKeyword, TokenType } from '../../enum/index.ts';

export interface AttrCharToken extends BaseToken {
    type: TokenType.AttributeChar,
    value: string
}

export interface AttrKeywordToken extends BaseToken {
    type: TokenType.AttributeKeyword;
    keyword: AttrKeyword;
}

export interface AttrValueToken extends BaseToken {
    type: TokenType.AttributeValue;
    value: string;
}