import { SectionType } from '../lexer/index.ts';
import { createDefaultAttributes } from "../shared/index.ts";
import { AttrSectionValidator } from './sections/attr.validator.section.ts';
import { BodySectionValidator } from './sections/body.validator.section.ts';
import { ProcSectionValidator } from './sections/proc.validator.section.ts';
import type { AttributeDefinitionNode, PanelAst, VariableReferenceNode, VerStatementNode } from '../parser/index.ts';
import type { Diagnostic, ParserResult } from '../shared/index.ts';
import type { ValidatedPanel } from './interfaces/index.ts';

/**
 * @class PanelValidator
 * 
 * This class is responsible to validate the current panel.
 * For example:
 * - Do attributes that are referred to exist?
 * - Are the statements in the PROC section complete?
 * - Do attributes in the ATTR section contain valid keywords and options?
 */
export class PanelValidator {
    private diagnostics: Diagnostic[];
    private ast: PanelAst | undefined;

    /**
     * Create a new PanelValidator instance
     * @param parserResult The result returned from the parser that is used by the validator
     */
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
    
    /**
     * Validate the currently parsed panel.
     * 
     * @remarks
     * The following sections are currently (partly) being validated:
     * - ATTR
     * - BODY
     * - PROC
     * @returns ValidatedPanel containing the AST, any current and previous diagnostics, and a map of defined attributes and used variables
     */
    public validate(): ValidatedPanel {
        let attributes: Map<string, AttributeDefinitionNode> = createDefaultAttributes();
        let variables: Map<string, VariableReferenceNode> = new Map();
        let checks: Map<string, VerStatementNode> = new Map();
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
                        result = new ProcSectionValidator(section).validate();
                        this.diagnostics.push(...result.diagnostics);
                        variables = result.referencedVariables;
                        checks = result.checks;
                        break;
                    default:
                        this.diagnostics.push({
                            message: `Section type '${section.sectionType}' is currently not supported`,
                            severity: 'fatal',
                            origin: 'VALIDATOR'
                        });
                }
            }
         
            return {
               ast: this.ast!,
                diagnostics: this.diagnostics,
                body: {
                    attributes: attributes,
                    variables: variables,
                    checks: checks
                }
            }
        } else {
            throw new Error(`No AST provided to validate`);
        }
    }
}