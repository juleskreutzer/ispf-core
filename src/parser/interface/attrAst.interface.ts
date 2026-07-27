import type { AttrKeyword } from "../../lexer/index.ts";
import type { AstNodeType } from "../enum/astNode.enum.ts";
import type { AstNode } from "./ast.interface.ts";

export interface AttributeDefinitionNode extends AstNode {
    type: AstNodeType.AttributeDefinition;
    attributeChar: string;
    options: AttributeOptionNode[];
}

export interface AttributeOptionNode extends AstNode {
    type: AstNodeType.AttributeOption;
    keyword: AttrKeyword;
    value?: string | undefined;
}