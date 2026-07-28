import type { TokenType } from '../../enum/index.ts';
import type { BaseToken } from '../index.ts';

export interface ProcCommandToken extends BaseToken {
    type: TokenType.ProcCommand;
    value: string;
}

export interface ProcKeywordToken extends BaseToken {
    type: TokenType.ProcKeyword;
    value: string;
}