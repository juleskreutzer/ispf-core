import { AttrKeyword } from '../lexer/index.ts';
import { AstNodeType } from '../parser/index.ts';
import type { AttributeDefinitionNode } from '../parser/index.ts';

export function createDefaultAttributes(): Map<string, AttributeDefinitionNode> {
    return new Map([
        ['%', createDefaultAttribute('%', 'TEXT', 'HIGH')],
        ['+', createDefaultAttribute('+', 'TEXT', 'LOW')],
        ['_', createDefaultAttribute('_', 'INPUT', 'HIGH')]
    ])
}

export function createDefaultAttribute(attributeChar: string, type: string, intens: string): AttributeDefinitionNode {
    return {
        type: AstNodeType.AttributeDefinition,
        attributeChar,
        options: [
            {
                type: AstNodeType.AttributeOption,
                keyword: AttrKeyword.TYPE,
                value: type
            },
            {
                type: AstNodeType.AttributeOption,
                keyword: AttrKeyword.INTENS,
                value: intens
            }
        ]
    };
}