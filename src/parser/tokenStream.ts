import { TokenType, type SourceLocation, type Token } from '../lexer/index.ts';

export class TokenStream {
    private position = 0;
    private readonly eofToken: Token;

    constructor(private readonly tokens: Token[]) {
        this.eofToken = this.createEofToken(tokens.at(-1));
    }

    get currentPosition(): number {
        return this.position;
    }

    get length(): number {
        return this.tokens.length;
    }
    
    isAtEnd(): boolean {
        return this.position >= this.tokens.length || this.peek().type === TokenType.EOF
    }

    peek(offset = 0): Token {
        const index = this.position + offset;

        if (index < 0) {
            return this.eofToken;
        }

        return this.tokens[index] ?? this.eofToken;
    }

    previous(): Token | undefined {
        return this.tokens[this.position - 1];
    }

    advance(): Token {
        const token = this.peek();

        if (!this.isAtEnd()) {
            this.position++;
        }

        return token;
    }

    consume(type?: TokenType): Token | undefined {
        if (type !== undefined && this.check(type)) return undefined

        if (this.isAtEnd()) return undefined

        return this.advance();
    }

    expect(type: TokenType, message?: string): Token {
        const token = this.consume(type);

        if (token) return token

        const actual = this.peek();
        throw new Error(message ?? `Expected token '${type}' but found '${actual.type}'`);
    }

    check(type: TokenType, offset = 0): boolean {
        return this.peek(offset).type === type;
    }

    match(...types: TokenType[]): Token | undefined {
        if (!types.some((type) => this.check(type))) return undefined;

        return this.advance();
    }

    save(): number {
        return this.position;
    }

    restore(position: number): void {
        if (!Number.isInteger(position) || position < 0 || position > this.tokens.length) {
            throw new RangeError(`Invalid token stream position '${position}'`);
        }

        this.position = position;
    }

    reset(): void {
        this.position = 0;
    }

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