import type { Token, SourceLocation } from '../../src/lexer/index.ts';
import { TokenType, SectionType, AttrKeyword } from '../../src/lexer/index.ts';
import type { SectionStartToken, VariableToken, OperatorToken, NumberToken, IdentifierToken, ErrorToken, CommentToken } from '../../src/lexer/interface/index.ts';

/**
 * Helper utilities for creating tokens in parser tests
 */

const DEFAULT_LOCATION: SourceLocation = {
    line: 1,
    column: 1,
    length: 1
};

export function createSourceLocation(
    line = 1,
    column = 1,
    length = 1
): SourceLocation {
    return { line, column, length };
}

export function createToken(
    type: TokenType,
    value?: string,
    location = DEFAULT_LOCATION
): Token {
    return { type, value, location };
}

export function createSectionStartToken(
    sectionType: SectionType,
    location = DEFAULT_LOCATION
): SectionStartToken {
    return {
        type: TokenType.SectionStart,
        value: sectionType,
        location
    };
}

export function createAttributeCharToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.AttributeChar, value, location };
}

export function createAttributeKeywordToken(
    keyword: AttrKeyword | string,
    location = DEFAULT_LOCATION
): Token {
    // Accept both enum and string values for flexibility
    const actualKeyword = typeof keyword === 'string' ? (keyword as AttrKeyword) : keyword;
    return { type: TokenType.AttributeKeyword, keyword: actualKeyword, location };
}

export function createAttributeValueToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.AttributeValue, value, location };
}

export function createBodyAttributeReferenceToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.BodyAttributeReference, value, location };
}

export function createProcCommandToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.ProcCommand, value, location };
}

export function createProcKeywordToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.ProcKeyword, value, location };
}

export function createIdentifierToken(
    value: string,
    location = DEFAULT_LOCATION
): IdentifierToken {
    return { type: TokenType.Identifier, value, location };
}

export function createStringToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.String, value, location };
}

export function createVariableToken(
    value: string,
    location = DEFAULT_LOCATION
): VariableToken {
    return { type: TokenType.Variable, value, location };
}

export function createOperatorToken(
    value: string,
    location = DEFAULT_LOCATION
): OperatorToken {
    return { type: TokenType.Operator, value, location };
}

export function createNumberToken(
    value: string,
    location = DEFAULT_LOCATION
): NumberToken {
    return { type: TokenType.Number, value, location };
}

export function createParenthesisToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.Parenthesis, value, location };
}

export function createCommentToken(
    value: string,
    location = DEFAULT_LOCATION
): CommentToken {
    return { type: TokenType.Comment, value, location };
}

export function createTextToken(
    value: string,
    location = DEFAULT_LOCATION
): Token {
    return { type: TokenType.Text, value, location };
}

export function createNewLineToken(location = DEFAULT_LOCATION): Token {
    return { type: TokenType.NewLine, location };
}

export function createErrorToken(
    message: string,
    value?: string,
    location = DEFAULT_LOCATION
): ErrorToken {
    return { type: TokenType.Error, message, value, location };
}

export function createEOFToken(location = DEFAULT_LOCATION): Token {
    return { type: TokenType.EOF, location };
}

/**
 * Create a sequence of tokens with optional newlines between them
 */
export function createTokenSequence(
    tokens: Token[],
    separateWithNewlines = false
): Token[] {
    if (!separateWithNewlines) {
        return [...tokens, createEOFToken()];
    }

    const result: Token[] = [];
    for (let i = 0; i < tokens.length; i++) {
        result.push(tokens[i]);
        if (i < tokens.length - 1) {
            result.push(createNewLineToken());
        }
    }
    result.push(createEOFToken());
    return result;
}
