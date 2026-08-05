import type { ElementType, IBaseElement } from "./base.element.interface.ts";

export interface IHeaderElement extends IBaseElement {
    type: ElementType.HEADER,
}