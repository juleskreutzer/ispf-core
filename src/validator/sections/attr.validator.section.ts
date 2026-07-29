import { AstNodeType, type SectionAst } from '../../parser/index.ts';
import { ATTR_SPEC, createDefaultAttributes } from '../../shared/index.ts';
import { BaseValidator } from './base.validator.section.ts';
import type { AttrValidatorResult, ValidatorResult } from '../../shared/index.ts';

export class AttrSectionValidator extends BaseValidator {

    constructor(section: SectionAst) {
        super(section);
    }

    override validate(): AttrValidatorResult {
        const table = createDefaultAttributes(); // Generates default % + _ attributes
        const panelAttributes = new Set<string>();

        for (const statement of this.section.statements) {
            if (statement.type !== AstNodeType.AttributeDefinition) continue;

            const attribute = statement.attributeChar;

            // Attribute already defined by panel?
            if (panelAttributes.has(attribute)) {
                this.createDiagnostic(`Duplicate attribute '${attribute}'`, 'error', statement.location);
                continue;
            }

            panelAttributes.add(attribute);

            // Create info message when pre-defined default attribute has been updated
            if (table.has(attribute)) {
                this.createDiagnostic(`Predefined attribute '${attribute}' updated with actual panal definition`, 'info', statement.location);
            }

            // Check if we have already seen the keyword
            const seen = new Set<string>();
            for (const option of statement.options) {
                const spec = ATTR_SPEC[option.keyword];

                // Check valid keyword
                if (!spec) {
                    this.createDiagnostic(`Unknown keyword '${option.keyword}'`, 'warning', option.location);
                    continue;
                }

                seen.add(option.keyword);

                // Check for valid keyword value
                if (spec && spec.allowedInputRegex && !spec.allowedInputRegex.test(option.value ?? '')) {
                    // Assume RegEx also allows default values
                    this.createDiagnostic(`Value '${option.value ?? ''}' is not allowed for keyword '${option.keyword}'`, 'error', option.location);
                    continue;
                } else if (spec && spec.values && !spec.values.includes(option.value ?? '')) {
                    this.createDiagnostic(`Unknown option '${option.value ?? ''}' for keyword '${option.keyword}'`, 'error', option.location);
                    continue;
                } else if (spec && spec.maxLength && (option.value ?? '').length > spec.maxLength) {
                    this.createDiagnostic(`Value '${option.value ?? ''}' should not exceed a length of '${spec.maxLength}' characters`, 'warning', option.location);
                    continue;
                }
            }

            table.set(attribute, statement);
        }

        return { diagnostics: this.diagnostics, attributes: table };
    }
}