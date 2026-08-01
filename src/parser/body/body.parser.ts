import { Parser } from '../parser.ts';
import { AttrKeyword, TokenType } from '../../lexer/index.ts';
import { AstNodeType } from '../enum/index.ts';
import type { AttributeDefinitionNode, AttributeOptionNode, BodyAttributeReferenceNode, BodyContentNode, BodyLineNode, BodyParserOptions, BodyTextNode, ErrorNode, VariableReferenceNode } from '../interface/index.ts';
import type { Token } from '../../lexer/index.ts';
import type { BodyStatementNode } from '../../shared/index.ts';

/**
 * Parses BODY sections into text, variables, and attribute references.
 */
export class BodyParser extends Parser {
    private readonly attributes: ReadonlyMap<string, AttributeDefinitionNode>;
    private currentAttribute: AttributeDefinitionNode | undefined;

    /**
     * Creates a body parser with an optional attribute-definition map.
     *
     * @param tokens The tokens representing the body section.
     * @param options Parsing options including known attributes.
     */
    constructor(tokens: Token[], options: BodyParserOptions = {}) {
        super(tokens);
        this.attributes = options.attributes ?? new Map();
    }

    /**
     * Parses the body section into one or more body lines.
     *
     * @returns Parsed body statements.
     */
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

    /**
     * Parses a single body line into content nodes.
     *
     * @returns A body line node or an error node.
     */
    private parseLine(): BodyStatementNode | undefined {
        const content: BodyContentNode[] = [];
        const firstToken = this.current;

        while(!this.isAtEnd() && !this.check(TokenType.NewLine) && !this.check(TokenType.SectionStart)) {
            const item = this.parseContent();

            if (item) {
                if (item.type === AstNodeType.BodyText) {
                    // Merge with previous token if it is also of type BodyText
                    const previous = content[content.length - 1];

                    if (previous && previous.type === AstNodeType.BodyText) {
                        const previousLength = previous.location?.length ?? previous.value.length
                        const itemLength = item.location?.length ?? item.value.length;

                        previous.value += item.value;
                        previous.location = {
                            line: previous.location?.length ?? item.location?.line ?? 0,
                            column: previous.location?.column ?? item.location?.column ?? 0,
                            length: previousLength + itemLength
                        };

                        continue;
                    }
                }
                
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

    /**
     * Parses the next content item in a body line.
     *
     * @returns A content node or an error node.
     */
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

            // If the definition is not found, return it as a BodyText node
            if (!definition) {
                return {
                    type: AstNodeType.BodyText,
                    value: attribute.value ?? '',
                    location: attribute.location
                } satisfies BodyTextNode
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

        return undefined;
    }

    /**
     * Detects field-variable references when the current attribute is a field-like attribute.
     *
     * @param text The text token to inspect.
     * @returns A variable reference node when the text matches a field-variable pattern.
     */
    private parseFieldVariable(text: Token): VariableReferenceNode | undefined {
        if (!this.currentAttribute || !this.isVariableFieldAttribute(this.currentAttribute)) return undefined;

        const match = /^(?<name>[A-Z][A-Z0-9#@$]*)(?<padding>\s*)$/i.exec(text.value ?? '');

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

    /**
     * Checks whether a given attribute is a field-style attribute that can contain variable references.
     *
     * @param attribute The attribute definition to inspect.
     * @returns True when the attribute is a field attribute.
     */
    private isVariableFieldAttribute(attribute: AttributeDefinitionNode): boolean {
        const typeOptions = attribute.options.find((option) => (option as AttributeOptionNode).keyword === AttrKeyword.TYPE);
        const type = typeOptions?.value?.toUpperCase();

        // Following is not exhaustive, check allowed TYPE values here: https://www.ibm.com/docs/en/zos/3.2.0?topic=section-formatting-attribute-statements
        return type === 'INPUT' || type === 'OUTPUT' || type === 'DATAIN' || type === 'DATAOUT';
    }
}