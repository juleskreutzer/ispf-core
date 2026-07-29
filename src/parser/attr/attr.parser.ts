import { TokenType } from '../../lexer/index.ts';
import { AstNodeType } from '../enum/index.ts';
import { Parser } from '../parser.ts';
import type { AttributeDefinitionNode, AttributeOptionNode, ErrorNode } from '../interface/index.ts';
import type { AttrKeywordToken, AttrValueToken } from '../../lexer/interface/index.ts';
import type { Token } from '../../lexer/index.ts';


export type AttrStatementNode = AttributeDefinitionNode | ErrorNode;

export class AttrParser extends Parser {
    constructor(tokens: Token[]) {
        super(tokens);
    }

    parse(): AttrStatementNode[] {
        const definitions: AttrStatementNode[] = [];

        this.skipTrivia();

        while(!this.isAtEnd()) {
            const definition = this.parseDefinition();

            if (definition) {
                definitions.push(definition);
            }

            this.skipTrivia();
        }

        return definitions;
    }

    private parseDefinition(): AttrStatementNode | undefined {
        const attributeChar = this.match(TokenType.AttributeChar);

        if(!attributeChar) {
            const lexerError = this.parseLexerError();

            if (lexerError) return lexerError
            // if (this.match(TokenType.Error)) {
            //     return this.errorNode(`Invalid attribute definitions`, this.previous);
            // }

            const error = this.errorNode(`Expected attribute char but found '${this.current.type}'`);
            this.recover({ consumeSynchronizationToken: true });
            return error;
        }

        const options: (AttributeOptionNode | ErrorNode)[] = []

        while(!this.isAtEnd() && !this.check(TokenType.AttributeChar) && !this.check(TokenType.SectionStart)) {
            if (this.match(TokenType.NewLine, TokenType.Comment)) continue;

            const option = this.parseOption();

            if (option) {
                options.push(option);
                continue;
            }
        }

        return {
            type: AstNodeType.AttributeDefinition,
            attributeChar: attributeChar.value ?? '',
            options,
            location: attributeChar.location
        };
    }

    private parseOption(): AttributeOptionNode | ErrorNode | undefined {
        const keyword = this.match(TokenType.AttributeKeyword) as AttrKeywordToken | undefined;

        if (!keyword) {
            const lexerError = this.parseLexerError();

            if (lexerError) return lexerError;

            if(this.match(TokenType.AttributeValue)) {
                this.error(`Unexpected attribute value without keyword`, this.current);
                return undefined
            }

            this.error(`Expected attribute keyword but found '${this.current.type}'`);
            return undefined;
        }

        const value = this.match(TokenType.AttributeValue) as AttrValueToken | undefined;
        
        return {
            type: AstNodeType.AttributeOption,
            keyword: keyword.keyword,
            value: value?.value,
            location: keyword.location
        };
    }
}