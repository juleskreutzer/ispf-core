import type { ElementLayout } from "./elements/base.element.interface.ts";

export interface PanelLayout {
    lines: PanelBodyLineLayout[];
}

export interface PanelBodyLineLayout {
    elements: ElementLayout[];
}