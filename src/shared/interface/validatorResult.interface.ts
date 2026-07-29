import type { AttributeDefinitionNode } from '../../parser/index.ts';
import type { Diagnostic } from './diagnostic.interface.ts';

export interface ValidatorResult {
    diagnostics: Diagnostic[];
}

export interface AttrValidatorResult extends ValidatorResult {
    attributes: Map<string, AttributeDefinitionNode>;
}