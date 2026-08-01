import { AstNodeType } from '../../parser/index.ts';
import { BaseValidator } from './base.validator.section.ts';
import type { ProcValidatorResult } from '../../shared/index.ts';
import type { ProcExpressionNode, ProcStatementNode, SectionAst, VariableReferenceNode } from '../../parser/index.ts';

/**
 * @class ProcSectionValidator
 * 
 * This class is responsible for the PROC section validation
 */
export class ProcSectionValidator extends BaseValidator {
    private referencedVariables: Map<string, VariableReferenceNode>;
    constructor(section: SectionAst) {
        super(section);

        // Used to keep track of variables that have been referenced in the PROC section
        this.referencedVariables = new Map<string, VariableReferenceNode>;
    }

    /**
     * Validate the current PROC section
     * @returns ProcValidatorResult containing a map of used variables
     */
    override validate(): ProcValidatorResult {

        for (const statement of this.section.statements) {
            if (statement.type === AstNodeType.Error) {
                this.createDiagnostic(statement.message, 'error', statement.location);
                continue;
            }

            if (statement.type !== AstNodeType.ProcStatement) continue;

            this.validateStatement(statement);
        }

        return { diagnostics: this.diagnostics, referencedVariables: this.referencedVariables };
    }

    /**
     * Validates statement
     * @param statement 
     * @returns  
     */
    private validateStatement(statement: ProcStatementNode) {
        if (!statement.command) {
            this.createDiagnostic(`PROC statement is missing a command`, 'error', statement.location);
            return;
        }

        this.walkExpressions(statement.argument);
    }

    private walkExpressions(expressions: ProcExpressionNode[]) {
        for (const expression of expressions) {
            this.walkExpression(expression);
        }
    }

    private walkExpression(node: ProcExpressionNode | undefined) {
        if (!node) return;

        switch(node.type) {
            case AstNodeType.BinaryExpression:
                this.walkExpression(node.left);
                this.walkExpression(node.right);
                return;
            case AstNodeType.UnaryExpression:
                this.walkExpression(node.operand);
                return;
            case AstNodeType.FunctionCallExpression:
                this.walkExpressions(node.arguments);
                return;
            case AstNodeType.Error:
                this.createDiagnostic(node.message, 'error', node.location);
                return;
            case AstNodeType.VariableReference:
                this.referencedVariables.set(node.value, node);
                this.createDiagnostic(`PROC section is referencing variable '${node.value}'`, 'trace', node.location);
                return;
            case AstNodeType.Identifier:
            case AstNodeType.StringLiteral:
            case AstNodeType.NumberLiteral:
            case AstNodeType.Operator:
            case AstNodeType.Comment:
            case AstNodeType.Text:
            case AstNodeType.ProcKeyword:
                return;
            default:
                this.createDiagnostic(`Unsupported PROC statement detected`, 'error');
        }
    }

}