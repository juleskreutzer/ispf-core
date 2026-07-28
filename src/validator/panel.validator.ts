import { SectionType } from '../lexer/index.ts';
import { AstNodeType } from '../parser/index.ts';4
import { createDefaultAttributes } from "../shared/index.ts";
import type { AttributeDefinitionNode, BodyAttributeReferenceNode, BodyLineNode, PanelAst } from '../parser/index.ts';
import type { Diagnostic } from '../shared/index.ts';

export class PanelValidator {
    public validate(ast: PanelAst): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        const attributes = this.collectAttributes(ast, diagnostics);
        this.validateBody(ast, attributes, diagnostics);

        return diagnostics;
    }

    private collectAttributes(ast: PanelAst, diagnostics: Diagnostic[]): Map<string, AttributeDefinitionNode> {
        const table = createDefaultAttributes();

        for (const section of ast.sections) {
            if (section.sectionType !== SectionType.ATTR) continue;

            for (const statement of section.statements) {
                if (statement.type !== AstNodeType.AttributeDefinition) continue;

                const attribute = statement.attributeChar;
                const previous = table.get(attribute);

                if (previous) {
                    if (attribute === '%' || attribute === '+' || attribute === '_') {
                        // Update the default configuration
                        table.set(attribute, statement);
                        diagnostics.push({
                            message: `Predefined attribute '${attribute}' updated with actual panel definition`,
                            severity: 'info',
                            location: statement.location
                        });
                    } else {
                        diagnostics.push({
                            message: `Duplicate attribute '${attribute}'`,
                            severity: 'error',
                            location: statement.location
                        });
                    }

                    continue
                }

                table.set(attribute, statement);
            }
        }

        return table;
    }

    private validateBody(ast: PanelAst, attributes: Map<string, AttributeDefinitionNode>, diagnostics: Diagnostic[]) {
        for (const section of ast.sections) {
            if (section.sectionType !== SectionType.BODY) continue;

            for (const statement of section.statements) {
                if (statement.type !== AstNodeType.BodyLine) continue;

                this.validateBodyLine(statement, attributes, diagnostics);
            }
        }
    }

    private validateBodyLine(line: BodyLineNode, attributes: Map<string, AttributeDefinitionNode>, diagnostics: Diagnostic[]) {
        for (const node of line.content) {
            if (node.type !== AstNodeType.BodyAttributeReference) continue;

            this.validateBodyAttribute(node, attributes, diagnostics);
        }
    }

    private validateBodyAttribute(node: BodyAttributeReferenceNode, attributes: Map<string, AttributeDefinitionNode>, diagnostics: Diagnostic[]) {
        const attribute = attributes.get(node.value);

        if (!attribute) {
            diagnostics.push({
                message: `Undefined attribute '${node.value}'`,
                severity: 'warning',
                location: node.location
            });

            return;
        }

        node.attribute = attribute;
    }
}