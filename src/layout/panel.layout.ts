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
        const capsValue = this.getAttributeOptionValue(attr, AttrKeyword.CAPS, true);
        const caps = capsValue === 'ON' || capsValue === 'IN' || capsValue === 'OUT';
        
        const intensValue = this.getAttributeOptionValue(attr, AttrKeyword.INTENS, true);
        const intensify = intensValue === 'HIGH';
        
        return {
            type: ElementType.TEXT,
            value: text,
            length: text.length,
            caps: caps,
            intensify: intensify,
            color: this.generateColor(attr),
            justify: this.generateJustify(attr)
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

    /**
     * Find an attribute option by keyword
     * 
     * @private
     * @param attr Attribute definition to search
     * @param keyword The keyword to find
     * @return The attribute option or undefined
     */
    private findAttributeOption(attr: AttributeDefinitionNode, keyword: AttrKeyword) {
        return attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === keyword);
    }

    /**
     * Get the value of an attribute option, optionally converted to uppercase
     * 
     * @private
     * @param attr Attribute definition to search
     * @param keyword The keyword to find
     * @param toUpper Whether to convert to uppercase
     * @return The option value or undefined
     */
    private getAttributeOptionValue(attr: AttributeDefinitionNode, keyword: AttrKeyword, toUpper: boolean = false): string | undefined {
        const option = this.findAttributeOption(attr, keyword);
        if (!option?.value) return undefined;
        return toUpper ? option.value.toUpperCase() : option.value;
    }

    /**
     * Generate the text color that should be used for this element
     * 
     * If color is not set, takes TYPE and INTENS keywords into account or falls back to `white`
     *
     * @private
     * @param {AttributeDefinitionNode} attr Attribute definition that is currently in effect
     * @return {string} Color name
     */
    private generateColor(attr: AttributeDefinitionNode): string {
        const colorValue = this.getAttributeOptionValue(attr, AttrKeyword.COLOR, false);
        
        if (colorValue) {
            const normalized = colorValue.toLowerCase();
            return normalized === 'turq' ? 'turquoise' : normalized;
        }

        // Color not found, use TYPE and INTENS for fallback
        this.diagnostics.push({
            message: `No color found for attribute '${attr.attributeChar}', using fallback`,
            origin: 'LAYOUT',
            severity: 'trace'
        });

        const typeValue = this.getAttributeOptionValue(attr, AttrKeyword.TYPE, true);
        if (!typeValue) {
            this.diagnostics.push({
                message: `Unable to determine type for attribute '${attr.attributeChar}', using fallback color 'white'`,
                origin: 'LAYOUT',
                severity: 'trace'
            });
            return 'white';
        }

        const intensValue = this.getAttributeOptionValue(attr, AttrKeyword.INTENS, true);
        const isHighIntensity = intensValue === 'HIGH';

        const colorMap: Record<string, { high: string; normal: string }> = {
            'TEXT': { high: 'white', normal: 'blue' },
            'OUTPUT': { high: 'white', normal: 'blue' },
            'INPUT': { high: 'red', normal: 'green' }
        };

        const colors = colorMap[typeValue];
        return colors ? (isHighIntensity ? colors.high : colors.normal) : 'white';
    }

    /**
     * Generate justification string
     * 
     * Converts ISPF JUST keyword values to CSS text-align values.
     * Defaults to `none` (ISPF's ASIS equivalent)
     *
     * @private
     * @param {AttributeDefinitionNode} attr Attribute definition
     * @return {string} Justify value (left, right, or none)
     */
    private generateJustify(attr: AttributeDefinitionNode): string {
        const justifyValue = this.getAttributeOptionValue(attr, AttrKeyword.JUST, true);
        if (!justifyValue) return 'none';

        const justifyMap: Record<string, string> = {
            'LEFT': 'left',
            'RIGHT': 'right',
            'ASIS': 'none'
        };

        return justifyMap[justifyValue] ?? 'none';
    }
}