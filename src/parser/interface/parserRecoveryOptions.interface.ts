import type { TokenType } from '../../lexer/index.ts';

export interface ParserRecoveryOptions {
    synchronizationTokens?: TokenType[] | undefined;
    consumeSynchronizationToken?: boolean | undefined;
}