import { TokenType } from './enum/index.ts';
import type { ErrorToken } from './interface/index.ts';

// Generic function to create ErrorToken where needed
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