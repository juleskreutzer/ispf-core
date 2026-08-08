import type { ElementType, IBaseElement } from "./base.element.interface.ts";

export interface ISelectionElement extends IBaseElement {
    type: ElementType.SELECTION;
    id: string;
    required: boolean;
    values: string[];
}