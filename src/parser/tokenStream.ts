import { TokenType, type SourceLocation, type Token } from '../lexer/index.ts';

/**
 * Provides cursor-based navigation over a token array for parsers.
 * The stream supports peeking, consuming, matching, and restoring positions.
 */
export class TokenStream {
    private position = 0;
    private readonly eofToken: Token;

    /**
     * Creates a new token stream over the supplied tokens.
     *
     * @param tokens The token sequence to parse.
     */
    constructor(private readonly tokens: Token[]) {
        this.eofToken = this.createEofToken(tokens.at(-1));
    }

    /**
     * Gets the current cursor position in the stream.
     */
    get currentPosition(): number {
        return this.position;
    }

    /**
     * Gets the number of tokens in the stream.
     */
    get length(): number {
        return this.tokens.length;
    }

    /**
     * Determines whether the stream has reached the end of the input.
     *
     * @returns True when the cursor is at the end or the next token is EOF.
     */
    isAtEnd(): boolean {
        return this.position >= this.tokens.length || this.peek().type === TokenType.EOF
    }

    /**
     * Returns the token at the current cursor position, optionally offset by a relative value.
     *
     * @param offset The number of tokens to look ahead or behind.
     * @returns The requested token, or an EOF token when no token exists.
     */
    peek(offset = 0): Token {
        const index = this.position + offset;

        if (index < 0) {
            return this.eofToken;
        }

        return this.tokens[index] ?? this.eofToken;
    }

    /**
     * Returns the token immediately before the current cursor position.
     *
     * @returns The previous token, or undefined if there is none.
     */
    previous(): Token | undefined {
        return this.tokens[this.position - 1];
    }

    /**
     * Advances the cursor by one token and returns the token that was consumed.
     *
     * @returns The current token before advancing.
     */
    advance(): Token {
        const token = this.peek();

        if (!this.isAtEnd()) {
            this.position++;
        }

        return token;
    }

    /**
     * Consumes the current token if it matches the supplied type.
     *
     * @param type The expected token type, or undefined to consume the current token unconditionally.
     * @returns The consumed token, or undefined if no token could be consumed.
     */
    consume(type?: TokenType): Token | undefined {
        if (type !== undefined && !this.check(type)) return undefined

        if (this.isAtEnd()) return undefined

        return this.advance();
    }

    /**
     * Consumes the current token if it matches the supplied type.
     *
     * @param type The expected token type.
     * @param message An optional custom error message.
     * @returns The consumed token.
     * @throws Throws an error when the expected token is not found.
     */
    expect(type: TokenType, message?: string): Token {
        const token = this.consume(type);

        if (token) return token

        const actual = this.peek();
        throw new Error(message ?? `Expected token '${type}' but found '${actual.type}'`);
    }

    /**
     * Checks whether the current token matches the supplied type.
     *
     * @param type The token type to compare against.
     * @param offset An optional lookahead offset.
     * @returns True when the token at the given offset matches the requested type.
     */
    check(type: TokenType, offset = 0): boolean {
        return this.peek(offset).type === type;
    }

    /**
     * Consumes the current token when it matches any of the supplied types.
     *
     * @param types One or more token types to match.
     * @returns The consumed token, or undefined if no match is found.
     */
    match(...types: TokenType[]): Token | undefined {
        if (!types.some((type) => this.check(type))) return undefined;

        return this.advance();
    }

    /**
     * Saves the current cursor position so it can be restored later.
     *
     * @returns The current stream position.
     */
    save(): number {
        return this.position;
    }

    /**
     * Restores the stream to a previously saved cursor position.
     *
     * @param position The position to restore.
     * @throws Throws when the supplied position is not a valid integer range.
     */
    restore(position: number): void {
        if (!Number.isInteger(position) || position < 0 || position > this.tokens.length) {
            throw new RangeError(`Invalid token stream position '${position}'`);
        }

        this.position = position;
    }

    /**
     * Resets the cursor to the beginning of the stream.
     */
    reset(): void {
        this.position = 0;
    }

    /**
     * Creates a synthetic EOF token to use when the stream is exhausted.
     *
     * @param lastToken The last token in the stream, if one exists.
     * @returns A token with EOF type and a matching location.
     */
    private createEofToken(lastToken: Token | undefined): Token {
        return {
            type: TokenType.EOF,
            location: {
                line: lastToken ? lastToken.location.line : 0,
                column: lastToken ? lastToken.location.column : 0,
                length: lastToken ? lastToken.location.length : 0
            }
        };
    }
}