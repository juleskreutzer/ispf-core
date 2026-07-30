import { Parser } from '../parser.ts';
import { AttrKeyword, TokenType } from '../../lexer/index.ts';
import { AstNodeType } from '../enum/index.ts';
import type { AttributeDefinitionNode, AttributeOptionNode, BodyAttributeReferenceNode, BodyContentNode, BodyLineNode, BodyParserOptions, BodyTextNode, ErrorNode, VariableReferenceNode } from '../interface/index.ts';
import type { Token } from '../../lexer/index.ts';

export type BodyStatementNode = BodyLineNode | ErrorNode;

export class BodyParser extends Parser {
    private readonly attributes: ReadonlyMap<string, AttributeDefinitionNode>;
    private currentAttribute: AttributeDefinitionNode | undefined;

    constructor(tokens: Token[], options: BodyParserOptions = {}) {
        super(tokens);
        this.attributes = options.attributes ?? new Map();
    }

    parse(): BodyStatementNode[] {
        const lines: BodyStatementNode[] = [];

        while(!this.isAtEnd()) {
            const line = this.parseLine();

            if (line) {
                lines.push(line);
            }
        }

        return lines;
    }

    private parseLine(): BodyStatementNode | undefined {
        const content: BodyContentNode[] = [];
        const firstToken = this.current;

        while(!this.isAtEnd() && !this.check(TokenType.NewLine) && !this.check(TokenType.SectionStart)) {
            const item = this.parseContent();

            if (item) {
                content.push(item);
                continue;
            }

            const error = this.errorNode(`Unexpected BODY toke '${this.current.type}'`);
            this.recover({ synchronizationTokens: [TokenType.NewLine, TokenType.SectionStart, TokenType.EOF] });
            return error;
        }

        const newLine = this.match(TokenType.NewLine);

        if (content.length === 0 && newLine) {
            return {
                type: AstNodeType.BodyLine,
                content,
                location: newLine.location
            };
        }

        if (content.length === 0) return undefined;

        return {
            type: AstNodeType.BodyLine,
            content,
            location: firstToken.location
        }
    }

    private parseContent(): BodyContentNode | ErrorNode | undefined {
        const text = this.match(TokenType.Text);

        if (text) {
            const fieldVariable = this.parseFieldVariable(text);

            if (fieldVariable) return fieldVariable;

            return {
                type: AstNodeType.BodyText,
                value: text.value ?? '',
                location: text.location
            } satisfies BodyTextNode;
        }

        const variable = this.match(TokenType.Variable);

        if (variable) {
            return {
                type: AstNodeType.VariableReference,
                value: variable.value ?? '',
                location: variable.location
            } satisfies VariableReferenceNode
        }

        const attribute = this.match(TokenType.BodyAttributeReference);

        if (attribute) {
            const definition = this.attributes.get(attribute.value ?? '');
            this.currentAttribute = definition;

            if (!definition && this.attributes.size > 0) {
                this.error(`BODY references undefined attribute '${attribute.value}'`, attribute, 'warning');
            }

            return {
                type: AstNodeType.BodyAttributeReference,
                value: attribute.value ?? '',
                attribute: definition,
                location: attribute.location
            } satisfies BodyAttributeReferenceNode
        }

        const lexerError = this.parseLexerError();

        if (lexerError) return lexerError;

        // if (this.match(TokenType.Error)) {
        //     this.error(`Invalid BODY content`, this.previous);
        //     return undefined;
        // }

        return undefined;
    }

    private parseFieldVariable(text: Token): VariableReferenceNode | undefined {
        if (!this.currentAttribute || !this.isVariableFieldAttribute(this.currentAttribute)) return undefined;

        const match = /^(?<name>[A-Z][A0Z0-9#@$]*)(?<padding>\s*)$/i.exec(text.value ?? '');

        if (!match?.groups?.name) return undefined;

        return {
            type: AstNodeType.VariableReference,
            value: match.groups.name,
            fieldLength: text.location.length,
            location: {
                line: text.location.line,
                column: text.location.column,
                length: match.groups.name.length
            }
        };
    }

    private isVariableFieldAttribute(attribute: AttributeDefinitionNode): boolean {
        const typeOptions = attribute.options.find((option) => (option as AttributeOptionNode).keyword === AttrKeyword.TYPE);
        const type = typeOptions?.value?.toUpperCase();

        // Following is not exhaustive, check allowed TYPE values here: https://www.ibm.com/docs/en/zos/3.2.0?topic=section-formatting-attribute-statements
        return type === 'INPUT' || type === 'OUTPUT' || type === 'DATAIN' || type === 'DATAOUT';
    }
}