import { SectionType } from '../lexer/index.ts';
import { AstNodeType } from '../parser/index.ts';
import { InputElement } from './elements/input.element.ts';
import { TextElement } from './elements/text.element.ts';
import type { ElementLayout, PanelBodyLineLayout, PanelLayout } from './interface/index.ts';
import type { AttributeDefinitionNode, BodyContentNode, BodyLineNode, SectionAst } from '../parser/index.ts';
import type { Diagnostic } from '../shared/index.ts';
import type { ValidatedPanel } from '../validator/index.ts';

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
     * Generate the panel layout based on the validated panel AST
     *
     * @return {*}  {PanelLayout} PanelLayout representing each line of the panel in layout elements such as text, input, header
     * @memberof PanelLayoutGenerator
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
     * Process the current body line from AST
     *
     * @private
     * @param line {@link BodyLineNode} with the elements for current line from AST
     * @memberof PanelLayoutGenerator
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
                    if (value.element) {
                        layoutLine.push(value.element);
                    }
                    this.diagnostics.push(...value.diags);
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
    private formatElement(attr: AttributeDefinitionNode, element: BodyContentNode): {element: ElementLayout | undefined, diags: Diagnostic[]} | undefined {
        switch(element.type) {
            case AstNodeType.BodyText:
                const textElementInstance = new TextElement(attr, element);
                const textElement = textElementInstance.create();
                return { element: textElement, diags: textElementInstance.diagnostics }
            case AstNodeType.VariableReference: 
                const inputElementInstance = new InputElement(attr, element);
                const inputElement = inputElementInstance.create();
                return { element: inputElement, diags: inputElementInstance.diagnostics }
            default:
                this.diagnostics.push({
                    message: `Unsupported node type during layout generation: '${element.type}`,
                    origin: 'LAYOUT',
                    severity: 'error'
                });

                return undefined;
        }
    }
}