import type { AttributeDefinitionNode, VariableReferenceNode } from '../../parser/index.ts';
import type { Diagnostic } from './diagnostic.interface.ts';

export interface ValidatorResult {
    diagnostics: Diagnostic[];
}

export interface AttrValidatorResult extends ValidatorResult {
    attributes: Map<string, AttributeDefinitionNode>;
}

export interface ProcValidatorResult extends ValidatorResult {
    referencedVariables: Map<string, VariableReferenceNode>;
}