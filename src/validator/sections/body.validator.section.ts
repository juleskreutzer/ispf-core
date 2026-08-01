import { AstNodeType } from '../../parser/index.ts';
import { BaseValidator } from './base.validator.section.ts';
import type { AttributeDefinitionNode, BodyLineNode, SectionAst } from '../../parser/index.ts';
import type { ValidatorResult } from '../../shared/index.ts';

/**
 * @class BodySectionValidator
 * 
 * This class is responsible for the BODY section validation
 */
export class BodySectionValidator extends BaseValidator {
    constructor(section: SectionAst, attributes: Map<string, AttributeDefinitionNode>) {
        super(section, attributes);
    }

    /**
     * Validate the current body section
     * @returns ValidatorResult containing diagnostics
     */
    validate(): ValidatorResult {
        if (this.section.statements.length > 0) {
            for (const statement of this.section.statements) {
                if (statement.type !== AstNodeType.BodyLine) continue;
                this.validateBodyLine(statement);
            }
        } else {
            //TODO: Should this just be a diagnostic or should we throw an error?
            this.createDiagnostic(`Empty body section found`, 'info', this.section.location);
        }
        
        return { diagnostics: this.diagnostics }
    }

    /**
     * Validate current line from BODY section
     * @param line 
     */
    private validateBodyLine(line: BodyLineNode) {
        let lineLength = 0;
        for (const node of line.content) {
            lineLength += node.location!.length; 
            if (node.type !== AstNodeType.BodyAttributeReference) continue;

            if (!this.attributes) {
                // This should never happen because default attributes are always created first during parsing.
                this.createDiagnostic(`No attributes are currently defined`, 'warning');
                continue;
            }

            const attribute = this.attributes.get(node.value);

            if (!attribute) {
                this.createDiagnostic(`Undefined attribute '${node.value}'`, 'warning', node.location);
                continue;
            }

            node.attribute = attribute;
        }

        if (lineLength > 80) {
            this.createDiagnostic(`line ${line.location?.line} exceeds 80 characters. Total line length is ${lineLength}, possible data truncation`, 'warning', line.location);
        }
    }
}