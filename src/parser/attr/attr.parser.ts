import { TokenType, type Token } from '../../lexer/index.ts';
import type { AttrKeywordToken, AttrValueToken } from '../../lexer/interface/token/attr.token.interface.ts';
import { AstNodeType } from '../enum/astNode.enum.ts';
import type { AttributeDefinitionNode, AttributeOptionNode, ErrorNode } from '../interface/index.ts';
import { Parser } from '../parser.ts';


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
            if (this.match(TokenType.Error)) {
                return this.errorNode(`Invalid attribute definitions`, this.previous);
            }

            const error = this.errorNode(`Expected attribute char but found '${this.current.type}'`);
            this.recover({ consumeSynchronizationToken: true });
            return error;
        }

        const options: AttributeOptionNode[] = []

        while(!this.isAtEnd() && !this.check(TokenType.AttributeChar) && !this.check(TokenType.SectionStart)) {
            if (this.match(TokenType.NewLine, TokenType.Comment)) continue;

            const option = this.parseOption();

            if (option) {
                options.push(option);
                continue;
            }

            this.recover();
            break;
        }

        return {
            type: AstNodeType.AttributeDefinition,
            attributeChar: attributeChar.value ?? '',
            options,
            location: attributeChar.location
        };
    }

    private parseOption(): AttributeOptionNode | undefined {
        const keyword = this.match(TokenType.AttributeKeyword) as AttrKeywordToken | undefined;

        if (!keyword) {
            if (this.match(TokenType.Error)) {
                this.error(`Invalid attribute option`, this.previous);
                return undefined;
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