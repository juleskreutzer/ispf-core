import { AttrKeyword } from '../../lexer/index.ts';
import { ElementType } from '../interface/index.ts';
import { BaseElement } from './base.element.ts';
import type { AttributeDefinitionNode, BodyContentNode } from '../../parser/index.ts';
import type { ElementLayout, ITextElement } from '../interface/index.ts';

export class TextElement extends BaseElement {
    constructor(attr: AttributeDefinitionNode, element: BodyContentNode) {
        super(attr, element);
    }

    /**
     * Create the `ElementLayout` that represents the current node.
     * 
     * See {@link ITextElement} for possible properties that can be filled
     *
     * @return {*}  {ElementLayout}
     * @memberof TextElement
     */
    create(): ElementLayout {
        return {
            type: ElementType.TEXT,
            value: this.element.value ?? '',
            length: this.element.value?.length ?? 0,
            caps: this.caps(),
            intensify: this.intensify(),
            color: this.color(),
            justify: this.justify()
        }
    }

    /**
     * Check if the current node should be displayed in uppercase.
     *
     * @private
     * @return {*}  {boolean} `true` when displayed in uppercase, `false` if not
     * @memberof TextElement
     */
    private caps(): boolean {
        const capsValue = this.getAttributeOptionValue(AttrKeyword.CAPS, true);
        return capsValue === 'ON' || capsValue === 'IN' || capsValue === 'OUT';
    }

    /**
     * Check if the current node should be displayed with extra attention, e.g as an alert, in bold, or however a renderer implements it
     *
     * @private
     * @return {*}  {boolean} `true` when displayed with extra attention, `false` if not
     * @memberof TextElement
     */
    private intensify(): boolean {
        const intensValue = this.getAttributeOptionValue(AttrKeyword.INTENS, true);
        return intensValue === 'HIGH';
    }

    /**
     * Get the color that is used to display the node in a 3270 terminal.
     *
     * @remark
     * If no color attribute is provided, the default colors based on the field type is assumed.
     * See https://www.ibm.com/docs/en/zos/3.1.0?topic=section-formatting-attribute-statements
     * 
     * @remark
     * If `color` and `type` are both unknown for the attribute definition, `white` will be returned
     * 
     * @private
     * @return {*}  {string} One of `white`, `red`, `blue`, `green`, `pink`, `yellow`, `turquoise`
     * @memberof TextElement
     */
    private color(): string {
        const colorValue = this.getAttributeOptionValue(AttrKeyword.COLOR);

        if (colorValue) {
            const normalized = colorValue.toLowerCase();
            return normalized === 'turq' ? 'turquoise' : normalized; // Convert TURQ to turquoise
        }

        this.createDiagnostic(`No COLOR keyword found for attribute '${this.attr.attributeChar}', using fallback`, 'warning', this.attr.location);

        const typeValue = this.getAttributeOptionValue(AttrKeyword.TYPE, true);
        if (!typeValue) {
            this.createDiagnostic(`Unable to determine TYPE for attribute '${this.attr.attributeChar}', using fallback color 'white'`, 'error', this.attr.location);
            return 'white';
        }

        const highIntensity: boolean = this.intensify();
        const colorMap: Record<string, { high: string, normal: string}> = {
            'TEXT': { high: 'white', normal: 'blue' },
            'OUTPUT': { high: 'white', normal: 'blue' },
            'INPUT': { high: 'red', normal: 'green' }
        };

        const colors = colorMap[typeValue];
        return colors ? (highIntensity ? colors.high : colors.normal) : 'white';
    }

    /**
     * Check if the current node should be alligned left or right
     *
     * @private
     * @return {*}  {string} `left`, `right`, `none`
     * @memberof TextElement
     */
    private justify(): string {
        const justifyValue = this.getAttributeOptionValue(AttrKeyword.JUST, true);
        if (!justifyValue) return 'none';

        const justifyMap: Record<string, string> = {
            'LEFT': 'left',
            'RIGHT': 'right',
            'ASIS': 'none'
        };

        return justifyMap[justifyValue] ?? 'none';
    }
}