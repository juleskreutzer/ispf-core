import type { ElementType, IBaseElement } from './base.element.interface.ts';

export interface ITextElement extends IBaseElement {
    type: ElementType.TEXT;
    caps?: boolean;
    intensify?: boolean;
    color?: string;
    justify?: string;
}