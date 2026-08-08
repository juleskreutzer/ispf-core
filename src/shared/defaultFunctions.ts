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

export function pictToRegex(pict: string): string {
    if (!pict) return '^$';

    let regex = '^' 
    
    for (const char of pict) {
        switch (char.toUpperCase()) {
            case 'C': 
                // Any character
                regex += '.'
                break;
            case 'A':
                // Any alphabetic character
                regex += '[A-Za-z#$@]';
                break;
            case 'N':
            case '9':
                // Numeric 
                regex += '[0-9]'
                break;
            case 'X':
                // hex character only
                regex += '[0-9A-Fa-f]';
                break;
            default:
                // Handle literal special 
                const specialChars = '.^$+?{}()[]|\\';

                if (specialChars.includes(char)) {
                    regex += '\\' + char; // escape special characters
                } else {
                    regex += char;
                }
        }
    }

    regex += '$';
    return regex;
}