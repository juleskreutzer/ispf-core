import { AstNodeType } from '../../parser/index.ts';
import { BaseValidator } from './base.validator.section.ts';
import type { AttributeDefinitionNode, BodyLineNode, SectionAst } from '../../parser/index.ts';
import type { ValidatorResult } from '../../shared/index.ts';

export class BodySectionValidator extends BaseValidator {
    constructor(section: SectionAst, attributes: Map<string, AttributeDefinitionNode>) {
        super(section, attributes);
    }

    validate(): ValidatorResult {
        if (this.section.statements.length > 0) {
            for (const statement of this.section.statements) {
                if (statement.type !== AstNodeType.BodyLine) continue;
                this.validateBodyLine(statement);
            }
        } else {
            this.createDiagnostic(`Empty body section found`, 'info', this.section.location);
        }
        
        return { diagnostics: this.diagnostics }
    }

    private validateBodyLine(line: BodyLineNode) {
        for (const node of line.content) {
            if (node.type !== AstNodeType.BodyAttributeReference) continue;

            if (!this.attributes) {
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
    }
}