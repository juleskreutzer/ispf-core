import type { AttributeDefinitionNode } from './index.ts';

export interface BodyParserOptions {
    attributes?: ReadonlyMap<string, AttributeDefinitionNode> | undefined;
}