import type { ElementType, IBaseElement } from "./base.element.interface.ts";

export interface IInputElement extends IBaseElement {
    type: ElementType.INPUT;
    id: string;
    required: boolean;
    pattern: string;
}