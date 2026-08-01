import type { BaseElement, ElementType } from "./base.element.interface.ts";

export interface InputElement extends BaseElement {
    type: ElementType.INPUT;
    id: string;
}