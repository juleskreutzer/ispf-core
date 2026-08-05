import type { IHeaderElement } from './header.element.interface.ts';
import type { IInputElement } from './input.element.interface.ts';
import type { ITextElement } from './text.element.interface.ts';

export interface IBaseElement {
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
    | ITextElement
    | IHeaderElement
    | IInputElement