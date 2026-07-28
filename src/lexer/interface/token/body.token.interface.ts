import type { TokenType } from '../../enum/index.ts';
import type { BaseToken } from '../index.ts';

export interface BodyAttributeReferenceToken extends BaseToken { 
    type: TokenType.BodyAttributeReference;
    value: string;
}