import { TokenType, SectionType } from '../lexer/index.ts';
import { AstNodeType } from './enum/astNode.enum.ts';
import { Parser } from './parser.ts';
import type { CommentNode, ErrorNode, PanelAst, SectionAst, SectionStatement, TextNode } from './interface/index.ts';
import type {  SectionStartToken, Token } from '../lexer/index.ts';
import { AttrParser, type AttrStatementNode } from './attr/attr.parser.ts';

export class PanelParser extends Parser {
    constructor(tokens: Token[]) {
        super(tokens);
    }

    parse(): PanelAst {
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
            type: AstNodeType.Panel,
            sections
        }
    }

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

    private collectSectionTokens(): Token[] {
        const tokens: Token[] = [];

        while(!this.isAtEnd() && !this.check(TokenType.SectionStart)) {
            tokens.push(this.advance());
        }

        return tokens;
    }

    private parseSectionStatements(sectionType: SectionType, tokens: Token[]): SectionStatement[] {
        switch (sectionType) {
            case SectionType.ATTR:
                return new AttrParser(tokens).parse() as AttrStatementNode[];
            default:
                return this.parseGenericStatements(tokens);
        }
    }

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