import { SectionType } from '../lexer/index.ts';
import { createDefaultAttributes } from "../shared/index.ts";
import { AttrSectionValidator } from './sections/attr.validator.section.ts';
import { BodySectionValidator } from './sections/body.validator.section.ts';
import { ProcSectionValidator } from './sections/proc.validator.section.ts';
import type { AttributeDefinitionNode, PanelAst } from '../parser/index.ts';
import type { Diagnostic, ParserResult, ValidatorResult } from '../shared/index.ts';

export class PanelValidator {
    private diagnostics: Diagnostic[];
    private ast: PanelAst | undefined;

    constructor(parserResult: ParserResult) {
        this.diagnostics = [];
        if (parserResult.diagnostics && parserResult.diagnostics.length > 0) {
            this.diagnostics = parserResult.diagnostics
        }

        if (!parserResult.ast) {
            this.diagnostics.push({
                message: `Unable to validate empty panel`,
                severity: 'fatal',
                origin: 'VALIDATOR'
            });
        } else {
            this.ast = parserResult.ast;
        }
    }
    
    public validate(): ValidatorResult {
        let attributes: Map<string, AttributeDefinitionNode> = createDefaultAttributes();
        let result;

        if (this.ast) {
            for(const section of this.ast.sections) {
                switch (section.sectionType) {
                    case SectionType.ATTR:
                        result = new AttrSectionValidator(section).validate();
                        this.diagnostics.push(...result.diagnostics);
                        attributes = result.attributes;
                        break;
                    case SectionType.BODY:
                        this.diagnostics.push(...new BodySectionValidator(section, attributes).validate().diagnostics);
                        break;
                    case SectionType.PROC:
                        this.diagnostics.push(...new ProcSectionValidator(section).validate().diagnostics);
                        break;
                    default:
                        this.diagnostics.push({
                            message: `Section type '${section.sectionType}' is currently not supported`,
                            severity: 'fatal',
                            origin: 'VALIDATOR'
                        });
                }
            }
        }

        return { diagnostics: this.diagnostics };
    }
}