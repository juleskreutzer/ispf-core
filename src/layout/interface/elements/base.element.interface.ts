import type { HeaderElement } from './header.element.interface.ts';
import type { InputElement } from './input.element.interface.ts';
import type { TextElement } from './text.element.interface.ts';

export interface BaseElement {
    type: ElementType;
    length: number;
    value?: string;
}

export enum ElementType {
    TEXT = 'text',
    INPUT = 'input',
    HEADER = 'header'
}

export type ElementLayout = 
    | TextElement
    | HeaderElement
    | InputElement