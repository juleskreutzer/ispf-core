import { TokenType } from '../lexer/index.ts';
import { AstNodeType, createParserDiagnostic, TokenStream } from './index.ts';
import type { ErrorNode } from './interface/index.ts';
import type { ParserRecoveryOptions } from './interface/index.ts';
import type { Token } from '../lexer/index.ts';
import type { Diagnostic, DiagnosticOrigin, DiagnosticSeverity } from '../shared/index.ts';

/**
 * Base class for concrete parsers that walk a token stream and build AST nodes.
 * It provides token access helpers and a shared diagnostics pipeline.
 */
export abstract class Parser {
    protected readonly stream: TokenStream
    private readonly parserDiagnostics: Diagnostic[] = [];

    /**
     * Initializes the parser with either a raw token array or an existing token stream.
     *
     * @param tokens The token source used by the parser.
     */
    protected constructor(tokens: Token[] | TokenStream) {
        this.stream = tokens instanceof TokenStream ? tokens : new TokenStream(tokens);
    }

    /**
     * Gets all diagnostics produced by the parser.
     */
    get diagnostics(): Diagnostic[] {
        return this.parserDiagnostics;
    }

    /**
     * Indicates whether the parser has emitted any diagnostics.
     */
    get hasDiagnostics(): boolean {
        return this.parserDiagnostics.length > 0;
    }

    /**
     * Gets the current token from the stream without advancing.
     */
    protected get current(): Token {
        return this.stream.peek();
    }

    /**
     * Gets the token immediately before the current cursor position.
     */
    protected get previous(): Token | undefined {
        return this.stream.previous();
    }

    /**
     * Checks whether the parser has reached the end of the token stream.
     */
    protected isAtEnd(): boolean {
        return this.stream.isAtEnd();
    }

    /**
     * Peeks at the token at the current position, optionally offset ahead.
     *
     * @param offset The relative offset from the current cursor.
     * @returns The token at the requested position.
     */
    protected peek(offset = 0): Token {
        return this.stream.peek(offset);
    }

    /**
     * Checks whether the current token matches the supplied type.
     *
     * @param type The token type to compare against.
     * @param offset An optional lookahead offset.
     * @returns True when the token matches the requested type.
     */
    protected check(type: TokenType, offset = 0): boolean {
        return this.stream.check(type, offset);
    }

    /**
     * Consumes the current token when it matches one of the supplied types.
     *
     * @param types One or more token types that may be consumed.
     * @returns The consumed token, or undefined when no match is found.
     */
    protected match(...types: TokenType[]): Token | undefined {
        return this.stream.match(...types);
    }

    /**
     * Advances the token stream by one token and returns the consumed token.
     *
     * @returns The token that was advanced past.
     */
    protected advance(): Token {
        return this.stream.advance();
    }

    /**
     * Consumes the current token if it matches the expected type.
     *
     * @param type The expected token type.
     * @param message Optional custom diagnostic message used when consumption fails.
     * @returns The consumed token, or undefined when the token does not match.
     */
    protected consume(type: TokenType, message?: string): Token | undefined {
        const token = this.stream.consume(type);

        if (token) return token;

        this.error(message ?? `Expected token '${type}' but found '${this.current,type}`, this.current);
    }

    /**
     * Creates and records a parser diagnostic for the supplied token.
     *
     * @param message The diagnostic message.
     * @param token The token associated with the problem.
     * @param severity The severity of the diagnostic.
     * @param origin The origin of the diagnostic.
     * @returns The created diagnostic object.
     */
    protected error(message: string, token: Token = this.current, severity: DiagnosticSeverity = 'error', origin: DiagnosticOrigin = 'PARSER'): Diagnostic {
        const diagnostic = createParserDiagnostic(message, token, severity, origin);
        this.parserDiagnostics.push(diagnostic);
        return diagnostic;
    }

    /**
     * Creates an error node for a parser failure and records a diagnostic.
     *
     * @param message The error message.
     * @param token The token where the error was encountered.
     * @returns An AST error node.
     */
    protected errorNode(message: string, token: Token = this.current): ErrorNode {
        this.error(message, token);

        return {
            type: AstNodeType.Error,
            message,
            value: token.value,
            location: token.location
        };
    }

    /**
     * Advances the stream until a synchronization token is reached.
     * This is used to recover from parser errors and continue parsing.
     *
     * @param options Recovery options including synchronization tokens.
     * @returns The token at the recovery position.
     */
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

    /**
     * Skips trivia tokens such as newlines and comments.
     */
    protected skipTrivia(): void {
        while (this.match(TokenType.NewLine, TokenType.Comment)) {
            // Do nothing, continue untill a non-trivia token is found
        }
    }

    /**
     * Appends diagnostics from another parser into this parser's diagnostic list.
     *
     * @param diags The diagnostics to merge in.
     */
    protected mergeDiagnostics(diags: Diagnostic[]): void {
        this.parserDiagnostics.push(...diags);
    }

    /**
     * Consumes a lexer error token and records it as a parser diagnostic.
     *
     * @returns An error node when a lexer error token was consumed, otherwise undefined.
     */
    protected parseLexerError(): ErrorNode | undefined {
        const token = this.match(TokenType.Error);

        if (!token) return undefined;

        this.error(token.value ?? 'Lexer error', token);

        return {
            type: AstNodeType.Error,
            message: token.value ?? 'Lexer error',
            value: token.value,
            location: token.location
        }
    }
}