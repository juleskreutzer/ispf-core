import { AttrKeyword, SectionType } from "../lexer/index.ts";
import { AstNodeType, type AttributeDefinitionNode, type BodyContentNode, type BodyLineNode, type PanelAst, type SectionAst } from "../parser/index.ts";
import type { BodyStatementNode, Diagnostic } from "../shared/index.ts";
import type { ValidatedPanel } from "../validator/index.ts";
import { ElementType, type ElementLayout, type PanelBodyLineLayout, type PanelLayout } from "./interface/index.ts";

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
        
        // if (panelAst.sections.length < 1) {
        //     throw new Error(`No input sections received to generate layout for provided input panel`);
        // }
        // this.ast = panelAst;

        // const temp: SectionAst | undefined = this.ast.sections.find(v => v.sectionType === SectionType.BODY);

        // if (temp) {
        //     this.body = temp;
        // } else {
        //     throw new Error(`No BODY section found for provided input panel`);
        // }'
    }

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

    private processBodyLine(line: BodyLineNode) {
        let currentAttr: AttributeDefinitionNode = this.panel.body.attributes.get('+')!; // + attribute is a default attribute and should always exist
        let layoutLine: ElementLayout[] = [];
        for (const node of line.content) {
            if (node.type === AstNodeType.BodyAttributeReference) {
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

    private formatText(text: string, attr: AttributeDefinitionNode): ElementLayout {
        const caps = attr.options.find(v => v.type === AstNodeType.AttributeOption && v.keyword === AttrKeyword.CAPS && (v.value === 'ON' || v.value === 'IN' || v.value === 'OUT')) ? true : false;
        
        return {
            type: ElementType.TEXT,
            value: text,
            length: text.length,
            caps: caps
        }
    }

    private formatInput(id: string, fieldLength: number = 0, attr: AttributeDefinitionNode): ElementLayout {
        return {
            type: ElementType.INPUT,
            id: id,
            length: fieldLength
        }
    }
}