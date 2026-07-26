import type { TokenType } from '../../enum/token.enum.ts';
import type { BaseToken } from '../token.interface.ts';

export interface ProcCommandToken extends BaseToken {
    type: TokenType.ProcCommand;
    value: string;
}

export interface ProcKeywordToken extends BaseToken {
    type: TokenType.ProcKeyword;
    value: string;
}