import type { AttributeDefinitionNode } from './attrAst.interface.ts';

export interface BodyParserOptions {
    attributes?: ReadonlyMap<string, AttributeDefinitionNode> | undefined;
}