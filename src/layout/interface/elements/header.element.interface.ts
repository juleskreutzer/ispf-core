import type { BaseElement, ElementType } from "./base.element.interface.ts";

export interface HeaderElement extends BaseElement {
    type: ElementType.HEADER,
}