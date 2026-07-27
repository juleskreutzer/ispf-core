import { TokenType } from '../lexer/index.ts';
import { AstNodeType, createParserDiagnostic, TokenStream } from './index.ts';
import type { ErrorNode, ParserDiagnostic, ParserDiagnosticSeverity } from './interface/index.ts';
import type { ParserRecoveryOptions } from './interface/parserRecoveryOptions.interface.ts';
import type { Token } from '../lexer/index.ts';

export abstract class Parser {
    protected readonly stream: TokenStream
    private readonly parserDiagnostics: ParserDiagnostic[] = [];

    protected constructor(tokens: Token[] | TokenStream) {
        this.stream = tokens instanceof TokenStream ? tokens : new TokenStream(tokens);
    }

    get diagnostics(): readonly ParserDiagnostic[] {
        return this.parserDiagnostics;
    }

    get hasDiagnostics(): boolean {
        return this.parserDiagnostics.length > 0;
    }

    protected get current(): Token {
        return this.stream.peek();
    }

    protected get previous(): Token | undefined {
        return this.stream.previous();
    }

    protected isAtEnd(): boolean {
        return this.stream.isAtEnd();
    }

    protected peek(offset = 0): Token {
        return this.stream.peek(offset);
    }

    protected check(type: TokenType, offset = 0): boolean {
        return this.stream.check(type, offset);
    }

    protected match(...types: TokenType[]): Token | undefined {
        return this.stream.match(...types);
    }

    protected advance(): Token {
        return this.stream.advance();
    }

    protected consume(type: TokenType, message?: string): Token | undefined {
        const token = this.stream.consume(type);

        if (token) return token;

        this.error(message ?? `Expected token '${type}' by found '${this.current,type}`, this.current);
    }

    protected error(message: string, token: Token = this.current, severity: ParserDiagnosticSeverity = 'error'): ParserDiagnostic {
        const diagnostic = createParserDiagnostic(message, token, severity);
        this.parserDiagnostics.push(diagnostic);
        return diagnostic;
    }

    protected errorNode(message: string, token: Token = this.current): ErrorNode {
        this.error(message, token);

        return {
            type: AstNodeType.Error,
            message,
            value: token.value,
            location: token.location
        };
    }
    
    protected recover(options: ParserRecoveryOptions = {}): Token | undefined {
        const synchronizationTokens = options.synchronizationTokens ?? [TokenType.NewLine, TokenType.SectionStart, TokenType.EOF];

        while(!this.isAtEnd() && !synchronizationTokens.some((type) => this.check(type))) {
            this.advance();
        }

        if (options.consumeSynchronizationToken && !this.isAtEnd()) {
            return this.advance();
        }

        return this.current;
    }

    protected skipTrivia(): void {
        while (this.match(TokenType.NewLine, TokenType.Comment)) {
            // Do nothing, continue untill a non-trivia token is found
        }
    }
}