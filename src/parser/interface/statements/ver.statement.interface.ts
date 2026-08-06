import type { ProcKeywordNode, ProcStatementNode } from '../procAst.interface.ts';

// https://www.ibm.com/docs/en/zos/3.1.0?topic=statements-ver-statement#ver

export interface VerParameter {
    type: VerType;
    values?: string[]; // To be used when a list of values can be provided
    value?: string;
    variable?: string; // Some parameters load their value from a variable e.g LISTV, LISTVX
    relationalOp?: string; // For LEN
    expectedValue?: string // For LEN, RANGE
}

export interface VerStatementNode extends ProcStatementNode {
    command: ProcKeywordNode;
    variable: string; // The variable being verified
    parameters: VerParameter[];
    message?: string; // MSG= param
    hasNonblank?: boolean;
}

export type VerType =
    | 'NONBLANK'
    | 'NB'
    | 'ALPHA'
    | 'ALPHAB'
    | 'BIT'
    | 'DBCS'
    | 'DBNAME'
    | 'DSNAMEF'
    | 'DSNAMEFM'
    | 'DSNAMEPQ'
    | 'DSNAMEQ'
    | 'EBCDIC'
    | 'ENUM'
    | 'FILEID'
    | 'HEX'
    | 'IDATE'
    | 'INCLUDE'
    | 'IMBLK'
    | 'IPADDR4'
    | 'ITIME'
    | 'JDATE'
    | 'JSTD'
    | 'LEN'
    | 'LIST'
    | 'LISTV'
    | 'LISTVX'
    | 'LISTX'
    | 'MIX'
    | 'NAME'
    | 'NAMEF'
    | 'NUM'
    | 'PICT'
    | 'PICTCN'
    | 'RANGE'
    | 'STDDATE'
    | 'STDTIME'