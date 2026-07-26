import type { TokenType } from "../../enum/token.enum.ts";
import type { BaseToken } from "../token.interface.ts";

export interface BodyAttributeReferenceToken extends BaseToken { 
    type: TokenType.BodyAttributeReference;
    value: string;
}