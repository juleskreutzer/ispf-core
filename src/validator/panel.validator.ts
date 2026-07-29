import { SectionType } from '../lexer/index.ts';
import { AstNodeType } from '../parser/index.ts';4
import { ATTR_SPEC,  createDefaultAttributes } from "../shared/index.ts";
import { AttrSectionValidator } from './sections/attr.validator.section.ts';
import { BodySectionValidator } from './sections/body.validator.section.ts';
import type { AttributeDefinitionNode, BodyAttributeReferenceNode, BodyLineNode, PanelAst } from '../parser/index.ts';
import type { Diagnostic } from '../shared/index.ts';

export class PanelValidator {
    public validate(ast: PanelAst): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];
        let attributes: Map<string, AttributeDefinitionNode> = createDefaultAttributes();
        let result;

        for(const section of ast.sections) {
            switch (section.sectionType) {
                case SectionType.ATTR:
                    result = new AttrSectionValidator(section).validate();
                    diagnostics.push(...result.diagnostics);
                    attributes = result.attributes;
                    break;
                case SectionType.BODY:
                    diagnostics.push(...new BodySectionValidator(section, attributes).validate().diagnostics);
                    break;
                default:
                    diagnostics.push({
                        message: `Section type '${section.sectionType}' is currently not supported`,
                        severity: 'fatal'
                    });
            }
        }
        // const attributes = this.collectAttributes(ast, diagnostics);
        // this.validateBody(ast, attributes, diagnostics);

        return diagnostics;
    }

    private collectAttributes(ast: PanelAst, diagnostics: Diagnostic[]): Map<string, AttributeDefinitionNode> {
        const table = createDefaultAttributes();
        const panelAttributes = new Set<string>();

        for (const section of ast.sections) {
            if (section.sectionType !== SectionType.ATTR) continue;

            for (const statement of section.statements) {
                if (statement.type !== AstNodeType.AttributeDefinition) continue;

                const attribute = statement.attributeChar;

                // Attribute already defined by panel?
                if (panelAttributes.has(attribute)) {
                    diagnostics.push({
                        message: `Duplicate attribute '${attribute}'`,
                        severity: 'error',
                        location: statement.location
                    });

                    continue;
                }

                panelAttributes.add(attribute);

                // Create info message when pre-defined default attribute has been updated
                if (table.has(attribute)) {
                    diagnostics.push({
                        message: `Predefined attribute '${attribute}' updated with actual panel definition`,
                        severity: 'info',
                        location: statement.location
                    });
                }

                const seen = new Set<string>();
                for (const option of statement.options) {
                    console.log(`attr: ${attribute} keyword: ${option.keyword} value: ${option.value}`);
                    const spec = ATTR_SPEC[option.keyword]
                    // Check for valid keyword
                    if (!spec) {
                        diagnostics.push({
                            message: `Unknown keyword '${option.keyword}'`,
                            severity: 'warning',
                            location: option.location
                        });

                        continue;
                    }

                    // Check for duplicate keyword
                    if (seen.has(option.keyword)) {
                        diagnostics.push({
                            message: `Duplicate keyword '${option.keyword}' for attribute '${attribute}'`,
                            severity: 'error',
                            location: option.location
                        });

                        continue
                    }

                    seen.add(option.keyword);

                    // Check for valid keyword value
                    if (spec && spec.values && !spec.values.includes(option.value ?? '')) {
                        diagnostics.push({
                            message: `Unknown option '${option.value ?? ''}' for keyword '${option.keyword}'`,
                            severity: 'error',
                            location: option.location
                        });
                    } else if (spec && spec.allowedInputRegex && !spec.allowedInputRegex.test(option.value ?? '')) {
                        diagnostics.push({
                            message: `Value '${option.value ?? ''}' is not allowed for keyword '${option.keyword}'`,
                            severity: 'error',
                            location: option.location
                        });
                    }

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