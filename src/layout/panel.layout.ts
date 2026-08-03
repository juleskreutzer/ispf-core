import { AttrKeyword, SectionType } from "../lexer/index.ts";
import { AstNodeType, type AttributeDefinitionNode, type BodyContentNode, type BodyLineNode, type PanelAst, type SectionAst } from "../parser/index.ts";
import type { BodyStatementNode, Diagnostic } from "../shared/index.ts";
import type { ValidatedPanel } from "../validator/index.ts";
import { ElementType, type ElementLayout, type PanelBodyLineLayout, type PanelLayout } from "./interface/index.ts";

/**
 * @class PanelLayoutGenerator
 * 
 * This class is responsible for generating the layout that can be used by exteral package to render the panel
 */
export class PanelLayoutGenerator {
    private body: SectionAst;
    private panel: ValidatedPanel;
    private diagnostics: Diagnostic[];
    private lines: PanelBodyLineLayout[];

    constructor(panel: ValidatedPanel) {
        if (panel.ast.sections.length < 1) {
            throw new Error(`No input sections received to generate layout for provided input panel`)
        }

        const foundBody: SectionAst | undefined = panel.ast.sections.find(v => v.sectionType === SectionType.BODY);
        if (foundBody) {
            this.body = foundBody
        } else {
            throw new Error(`No BODY section found for provided input panel`);
        }

        this.panel = panel;

        this.diagnostics = panel.diagnostics;
        this.lines = [];
    }

    /**
     * Generate the panel layout based on a previously created panel AST
     * @returns PanelLayout representing each line of the panel in layout elements such as text, input, header
     */
    generate(): PanelLayout {
        if (this.body.statements.length > 0) {
            for (const statement of this.body.statements) {
                if (statement.type !== AstNodeType.BodyLine) continue;

                this.processBodyLine(statement);
            }
        } else {
            this.diagnostics.push({
                message: `No body content for panel found`,
                origin: 'LAYOUT',
                severity: 'fatal'
            });
        }

        return {
            lines: this.lines
        }
    }

    /**
     * Process the current body line from the AST
     * @param line {@link BodyLineNode} representing the current AST elements in the line
     */
    private processBodyLine(line: BodyLineNode) {
        let currentAttr: AttributeDefinitionNode = this.panel.body.attributes.get('+')!; // + attribute is a default attribute and should always exist
        let layoutLine: ElementLayout[] = [];

        for (const node of line.content) {
            if (node.type === AstNodeType.BodyAttributeReference) {
                // Used to determine how next node should be formatted
                currentAttr = this.panel.body.attributes.get(node.attribute!.attributeChar)!;
            } else {
                const value = this.formatElement(currentAttr, node);
                if (value) {
                    layoutLine.push(value);
                }
            }
        }

        this.lines.push({ elements: layoutLine });
    }

    /**
     * Format current node based on its type
     * @param attr {@link AttributeDefinitionNode} that is currently into effect, affecting how the element should be rendered
     * @param element {@link BodyContentNode} current element that will be processed
     * @returns ElementLayout or undefined if the current {@link BodyContentNode.type} is not supported
     */
    private formatElement(attr: AttributeDefinitionNode, element: BodyContentNode): ElementLayout | undefined {
        switch(element.type) {
            case AstNodeType.BodyText:
                return this.formatText(element.value, attr);
            case AstNodeType.VariableReference: 
                return this.formatInput(element.value, element.fieldLength, attr);
            default:
                this.diagnostics.push({
                    message: `Unsupported node type during layout generation: '${element.type}`,
                    origin: 'LAYOUT',
                    severity: 'error'
                });

                return undefined;
        }

    }

    /**
     * Format current element as a `text` layout element
     * @param text Value for the current element
     * @param attr {@link AttributeDefinitionNode} which options will be used to determine how the element should be created
     * @returns ElementLayout
     * 
     * @remark
     * Consume is responsible to adhere to any additional options that are returned from this method.
     * E.g if `caps: true`, the `value` should be converted to uppercase. This is not done automatically. 
     */
    private formatText(text: string, attr: AttributeDefinitionNode): ElementLayout {
        // Check if the content should be written in caps
        const caps = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.CAPS && (v.value === 'ON' || v.value === 'IN' || v.value === 'OUT')) ? true : false;
        const intensify = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.INTENS && v.value === 'HIGH') ? true : false;
        
        return {
            type: ElementType.TEXT,
            value: text,
            length: text.length,
            caps: caps,
            intensify: intensify,
            color: this.generateColor(attr)
        }
    }

    /**
     * Format current element as a `input` layout element
     * @param id ID that should be used to identify the input element
     * @param [fieldLength] Length of the field, defaults to 0
     * @param attr {@link AttributeDefinitionNode} which options will be used to determine how the element should be created
     * @returns ElementLayout
     */
    private formatInput(id: string, fieldLength: number = 0, attr: AttributeDefinitionNode): ElementLayout {
        return {
            type: ElementType.INPUT,
            id: id,
            length: fieldLength
        }
    }

    private generateColor(attr: AttributeDefinitionNode): string {
        const color = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.COLOR);
        let colorValue = '';

        if (color && color.value) {
            colorValue = color.value.toLowerCase();
            if (colorValue === 'turq') {
                colorValue = 'turquoise'; // ISPF used abbreviation for turquoise, but we want to use the full name in the layout
            }
        } else {
            // Color not found in attribute definition
            this.diagnostics.push({
                message: `No color found for attribute '${attr.attributeChar}', using fallback`,
                origin: 'LAYOUT',
                severity: 'trace'
            });

            const type = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.TYPE);
            const intens = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.INTENS);
            if (type && type.value) {
                switch (type.value.toUpperCase()) {
                    case 'TEXT':
                    case 'OUTPUT':
                        if (intens && intens.value && intens.value.toUpperCase() === 'HIGH') {
                            colorValue = 'white';
                        } else {
                            colorValue = 'blue';
                        }
                        break;
                    case 'INPUT':
                        if (intens && intens.value && intens.value.toUpperCase() === 'HIGH') {
                            colorValue = 'red';
                        } else {
                            colorValue = 'green';
                        }
                        break;
                    default:
                        colorValue = 'white';
                }

            } else {
                this.diagnostics.push({
                    message: `Unable to determine type for attribute '${attr.attributeChar}', using fallback color 'white'`,
                    origin: 'LAYOUT',
                    severity: 'trace'
                });

                colorValue = 'white';
            }
        }

        return colorValue;
    }
}