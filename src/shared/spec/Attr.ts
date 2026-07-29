export interface AttrKeywordSpec {
    values?: readonly string[];
    requiredValue: boolean;
    repeatable: boolean;
    maxLength?: number;
    allowedInputRegex?: RegExp;
    note?: string
}

export const ATTR_SPEC: Record<string, AttrKeywordSpec> =  {
    AREA: {
        values: ['DYNAMIC', 'GRAPHIC', 'SCRL'],
        requiredValue: false,
        repeatable: false
    },
    EXTEND: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    SCROLL: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    USERMOD: {
        maxLength: 1,
        requiredValue: false,
        repeatable: false
    },
    DATAMOD: {
        maxLength: 1,
        requiredValue: false,
        repeatable: false
    },
    ATTN: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    CAPS: {
        values: ['ON', 'OFF', 'IN', 'OUT'],
        requiredValue: false,
        repeatable: false
    },
    CKBOX: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    COLOR: {
        values: ['WHITE', 'RED', 'BLUE', 'GREEN', 'PINK', 'YELLOW', 'TURQ'],
        requiredValue: false,
        repeatable: false
    },
    COMBO: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]/,
        note: 'The COMBO keyword is accepted in order to support existing panel definitions that use it. However, it no longer affects the displayed panel.'
    },
    CSRGRP: {
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[0-9]/,
        maxLength: 2
    },
    CUADYN: {
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]/
    },
    DDLIST: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9.]/,
        note: 'The DDLIST keyword is accepted in order to support existing panel definitions that use it. However, it no longer affects the displayed panel.'
    },
    DEPTH: {
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[0-9]/,
        maxLength: 1
    },
    FORMAT: {
        values: ['EBCDIC', 'DBCS', 'MIX'],
        requiredValue: false,
        repeatable: false
    },
    GE: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    HILITE: {
        values: ['USCORE', 'BLINK', 'REVERSE'],
        requiredValue: false,
        repeatable: false
    },
    INTENS: {
        values: ['HIGH', 'LOW', 'NON'],
        requiredValue: false,
        repeatable: false
    },
    JUST: {
        values: ['LEFT', 'RIGHT', 'ASIS'],
        requiredValue: false,
        repeatable: false
    },
    LISTBOX: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]/,
        note: 'The LISTBOX keyword is accepted in order to support existing panel definitions that use it. However, it no longer affects the displayed panel.'
    },
    NOJUMP: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    NUMERIC: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    OUTLINE: {
        values: ['L', 'R', 'O', 'U', 'BOX', 'NONE'],
        requiredValue: false,
        repeatable: false
    },
    PAD: {
        values: [ 'NULLS', 'USER'],
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]<\(\+\)\;\,\>\:\=\¬\s/
    },
    PADC: {
        values: ['NULLS', 'USER'],
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]<\(\+\)\;\,\>\:\=\¬\s/
    },
    PAS: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    RADIO: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    REP: {
        requiredValue: false,
        repeatable: false,
        allowedInputRegex: /[A-Z0-9]/,
        maxLength: 1
    },
    SKIP: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    TYPE: {
        values: ['AB', 'ABSL', 'CEF', 'CH', 'CHAR', 'CT', 'DATAIN', 'DATAOUT', 'DT', 'EE', 'ET', 'FP', 'GRPBOX', 'INPUT', 'LEF', 'LI', 'LID', 'NEF', 'NT', 'OUTPUT', 'PIN', 'PS', 'PT', 'RP', 'SAC', 'SC', 'SI', 'SUC', 'TEXT', 'VOI', 'WASL', 'WT'],
        requiredValue: true,
        repeatable: false
    },
    UNAVAIL: {
        values: ['ON', 'OFF'],
        requiredValue: false,
        repeatable: false
    },
    WIDTH: {
        requiredValue: false,
        repeatable: false,
        maxLength: 2,
        allowedInputRegex: /[0-9]/,
        note: 'The WIDTH keyword is accepted in order to support existing panel definitions that use it. However, it no longer affects the displayed panel. '
    }
}