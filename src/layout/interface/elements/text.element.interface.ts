import type { BaseElement, ElementType } from './base.element.interface.ts';

export interface TextElement extends BaseElement {
    type: ElementType.TEXT;
    caps?: boolean;
    intensify?: boolean;
    color?: string;
    justify?: string;
}