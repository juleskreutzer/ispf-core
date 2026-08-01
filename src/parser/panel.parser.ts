import { TokenType, SectionType } from '../lexer/index.ts';
import { AstNodeType } from './enum/index.ts';
import { Parser, AttrParser, BodyParser, ProcParser } from './index.ts';
import { createDefaultAttributes } from '../shared/index.ts';
import type { CommentNode, ErrorNode, PanelAst, SectionAst, SectionStatement, TextNode } from './interface/index.ts';
import type { SectionStartToken, Token } from '../lexer/index.ts';
import type { ParserResult } from '../shared/index.ts';

/**
 * Parses a full panel source into sections and statements.
 */
export class PanelParser extends Parser {
    private readonly attributes = createDefaultAttributes();

    /**
     * Creates a panel parser for the supplied token stream.
     *
     * @param tokens The tokens representing the panel source.
     */
    constructor(tokens: Token[]) {
        super(tokens);
    }

    /**
     * Parses the complete panel and returns the AST plus diagnostics.
     *
     * @returns The parsed panel result.
     */
    parse(): ParserResult {
        const sections: SectionAst[] = [];

        this.skipTrivia();

        while(!this.isAtEnd()) {
            const section = this.parseSection();

            if (section) {
                sections.push(section);
            }

            this.skipTrivia();
        }

        return {
            ast: {
                type: AstNodeType.Panel,
                sections
            },
            diagnostics: this.diagnostics
        }

    }

    /**
     * Parses the next section from the current token stream.
     *
     * @returns A section AST node, or undefined when parsing cannot continue.
     */
    private parseSection(): SectionAst | undefined {
        const sectionStart = this.match(TokenType.SectionStart) as SectionStartToken | undefined;

        if (!sectionStart) {
            this.error(`Expected section start but found '${this.current.type}'`);
            this.recover({ synchronizationTokens: [TokenType.SectionStart, TokenType.EOF] });
            return undefined;
        }

        const sectionTokens = this.collectSectionTokens();
        const statements = this.parseSectionStatements(sectionStart.value, sectionTokens);

        return {
            type: AstNodeType.Section,
            sectionType: sectionStart.value,
            name: sectionStart.value,
            statements,
            location: sectionStart.location
        };
    }

    /**
     * Collects tokens belonging to the current section until the next section start.
     *
     * @returns The tokens for the current section.
     */
    private collectSectionTokens(): Token[] {
        const tokens: Token[] = [];

        while(!this.isAtEnd() && !this.check(TokenType.SectionStart)) {
            tokens.push(this.advance());
        }

        return tokens;
    }

    /**
     * Parses the statements that belong to a specific section type.
     *
     * @param sectionType The section being parsed.
     * @param tokens The tokens belonging to that section.
     * @returns Parsed statements for the section.
     */
    private parseSectionStatements(sectionType: SectionType, tokens: Token[]): SectionStatement[] {
        let statements;
        switch (sectionType) {
            case SectionType.ATTR: {
                const attrParser: AttrParser = new AttrParser(tokens);
                statements = attrParser.parse();
                this.mergeDiagnostics(attrParser.diagnostics);

                // Store ATTR definitions so that they can for example be used in the BODY section
                for (const statement of statements) {
                    if (statement.type === AstNodeType.AttributeDefinition) {
                        this.attributes.set(statement.attributeChar, statement);
                    }
                }

                return statements;
            }
            case SectionType.BODY: 
                const bodyParser = new BodyParser(tokens, { attributes: this.attributes });
                statements = bodyParser.parse();
                this.mergeDiagnostics(bodyParser.diagnostics);
                return statements;
            case SectionType.PROC:
                const procParser: ProcParser = new ProcParser(tokens);
                statements = procParser.parse();
                this.mergeDiagnostics(procParser.diagnostics);
                return statements;
            default:
                return this.parseGenericStatements(tokens);
        }
    }

    /**
     * Parses tokens that do not belong to a specialized section parser.
     *
     * @param tokens The tokens to convert into generic AST statements.
     * @returns Generic statements such as text or comments.
     */
    private parseGenericStatements(tokens: Token[]): SectionStatement[] {
        return tokens.flatMap((token): SectionStatement[] => {
            switch(token.type) {
                case TokenType.Text:
                    return [{type: AstNodeType.Text, value: token.value ?? '', location: token.location} satisfies TextNode]
                case TokenType.Comment:
                    return [{type: AstNodeType.Comment, value: token.value ?? '', location: token.location} satisfies CommentNode]
                case TokenType.Error:
                    return [{type: AstNodeType.Error, message: token.message, value: token.value, location: token.location} satisfies ErrorNode]
                default:
                    return []
            }
        });
    }
}