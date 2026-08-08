import type { VerParameter, VerStatementNode } from '../../../parser/index.ts';
import type { Diagnostic, DiagnosticOrigin, DiagnosticSeverity, VerProcValidatorResult } from '../../../shared/index.ts';

export class VerStatementValidator {
    private diagnostics: Diagnostic[];
    private checks: Map<string, VerStatementNode>;
    private statement: VerStatementNode;

    constructor(statement: VerStatementNode) {
        this.diagnostics = [];
        this.checks = new Map();

        this.statement = statement;
    }

    validate(): VerProcValidatorResult {
        this.validateVariable(this.statement.variable);

        for (const param of this.statement.parameters) {
            this.validateParameter(param);
        }

        return {
            diagnostics: this.diagnostics,
            checks: this.checks
        }
        
    }

    private validateVariable(variable: string): void {
        if (!variable || variable.trim().length === 0) {
            this.createDiagnostic(`VER variable cannot be empty`, 'error');
        }
    }

    private validateParameter(param: VerParameter): void {
        switch(param.type) {
            case 'PICT':
                this.validatePictParam(param);
                break;
            case 'LIST':
            case 'LISTX':
                this.validateListParam(param);
                break;
            case 'LEN':
                this.validateLenParameter(param);
                break;
            case 'RANGE':
                this.validateRangeParameter(param);
            case 'INCLUDE':
            case 'IMBLK':
            case 'PICTCN':
                this.createDiagnostic(`Validation of '${param.type}' within the VER statement is currently not supported`, 'warning');
                break;
            default:
                // No additional checks required, statements that hit the default cause require no params
        }
    }

    private validatePictParam(param: VerParameter): void {
        if (!param.value) {
            this.createDiagnostic(`PICT parameter requires a picture string`, 'error');
            return;
        }

        const validMask = /^(?:[CANX9]|[^A-Za-z0-9])*$/i;
        if (!validMask.test(param.value)) {
            this.createDiagnostic(`PICT parameter contains invalid characters. Valid characters are: C, A, N, X, 9 and special characters`, 'error');
        }

        // Remove & from variable name and make sure the key is always in uppercase
        this.checks.set(this.statement.variable.replace('&', '').toUpperCase(), this.statement);
    }

    private validateListParam(param: VerParameter): void {
        if (!param.values || param.values.length < 2) {
            this.createDiagnostic(`${param.type} requires at least 2 values`, 'error');
            return;
        }

        if (param.values && param.values.length > 100) {
            this.createDiagnostic(`'${param.type}' allows a maximum of 100 values, current amount is ${param.values.length}`, 'error');
        }

        this.checks.set(this.statement.variable.replace('&', '').toUpperCase(), this.statement);
    }

    private validateLenParameter(param: VerParameter): void {
        if (!param.relationalOp) {
            this.createDiagnostic(`LEN requires a relational operator`, 'error');
            return;
        }

        if (!param.expectedValue) {
            this.createDiagnostic(`LEN requires and expected length value`, 'error');
            return;
        }

        const validRops = ['=', '<', '>', '<=', '>=', '¬=', '¬>', '¬<', 'EQ', 'LT', 'GT', 'LE', 'GE', 'NE', 'NG', 'NL'];
        if (param.relationalOp && !validRops.includes(param.relationalOp.toUpperCase())) {
            this.createDiagnostic(`Invalid relational operator '${param.relationalOp}'`, 'error');
        }
    }

    private validateRangeParameter(param: VerParameter): void {
        if (!param.values || param.values.length < 2) {
            this.createDiagnostic(`RANGE requires lower and upper bounds values to be provided`, 'error');
        }
    }

    private createDiagnostic(message: string, severity: DiagnosticSeverity, origin: DiagnosticOrigin = 'VALIDATOR') {
        this.diagnostics.push({
            message: message,
            severity: severity,
            origin: origin
        });
    }
}