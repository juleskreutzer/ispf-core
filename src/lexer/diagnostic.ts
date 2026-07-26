import { TokenType } from './enum/token.enum.ts';
import type { ErrorToken } from './interface/index.ts';

export function createErrorToken(message: string, line: number, column: number, value?: string): ErrorToken {
    return {
        type: TokenType.Error,
        value,
        message,
        location: {
            line,
            column,
            length: value?.length ?? 1
        }
    }
}