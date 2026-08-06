import { ProcKeyword, TokenType, type Token } from '../../../lexer/index.ts';
import { AstNodeType } from '../../enum/index.ts';
import type { ErrorNode, VerParameter, VerStatementNode, VerType } from '../../interface/index.ts';
import type { Parser } from '../../parser.ts';

/**
 * Parses VER (verify) statements according to IBM documentation:
 * https://www.ibm.com/docs/en/zos/3.1.0?topic=statements-ver-statement#ver
 * 
 * Syntax: VER(variable [,type1 [,type2]] [,value] [,MSG=msgid])
 * 
 * This class provides static methods that work within a parent parser's context,
 * allowing it to maintain the correct token stream position.
 */
export class VerStatementParser {
    /**
     * Parses a VER statement starting after the VER keyword
     * VER(...) format
     * 
     * @param parser The parent parser instance to use for token consumption
     * @param verKeyword The VER keyword token
     * @returns A VerStatementNode or ErrorNode
     */
    static parse(parser: Parser, verKeyword: Token): VerStatementNode | ErrorNode | undefined {
        if (!parser.match(TokenType.Parenthesis) || parser.previous?.value !== '(') {
            parser.error('VER statement must be followed by (variable, ...)', verKeyword);
            return parser.errorNode('Invalid VER syntax');
        }

        // Parse the variable being verified
        const variable = parser.match(TokenType.Variable, TokenType.Identifier);
        if (!variable) {
            parser.error(`VER requires a variable as first argument`, parser.current);
            return parser.errorNode(`VER variable not specified`);
        }

        const variableName = variable.value ?? '';

        // Parse parameters separated by commas
        const params: VerParameter[] = [];
        let hasNonBlank = false;
        let message: string | undefined;

        while (!parser.isAtEnd() && !VerStatementParser.checkParenthesis(parser, ')')) {
            parser.matchComma();
            
            if (VerStatementParser.checkParenthesis(parser, ')')) break;

            const param = VerStatementParser.parseVerParameter(parser);
            if (param) {
                if (param.type === 'NONBLANK' || param.type === 'NB') {
                    hasNonBlank = true;
                } else if (param.type.startsWith('MSG=')) {
                    message = param.value;
                } else {
                    params.push(param);
                }
            }
        }

        if (!parser.matchClosingParenthesis()) {
            parser.error('Expected ) to close VER statement', parser.current);
        }

        parser.match(TokenType.NewLine);

        return {
            type: AstNodeType.ProcStatement,
            command: {
                type: AstNodeType.ProcKeyword,
                keyword: ProcKeyword.VER,
                location: verKeyword.location
            },
            variable: variableName,
            parameters: params,
            message: message ?? '',
            hasNonblank: hasNonBlank,
            argument: [],
            location: verKeyword.location
        };
    }

    /**
     * Parses a single VER parameter
     */
    private static parseVerParameter(parser: Parser): VerParameter | undefined {
        const token = parser.current;
        const keyword = token.value?.toUpperCase() ?? '';

        if (!keyword) return undefined;

        // Handle MSG= parameter
        if (keyword.startsWith('MSG=')) {
            const msgValue = keyword.substring(4);
            parser.advance();
            return { type: 'MSG=' as VerType, value: msgValue };
        }

        // Handle keywords with values (these require additional parameters)
        if (['PICT', 'PICTCN', 'RANGE', 'LEN', 'LIST', 'LISTV', 'LISTVX', 'LISTX', 'INCLUDE'].includes(keyword)) {
            parser.advance();
            return VerStatementParser.parseParameterWithValues(parser, keyword);
        }

        // Handle DSNAME variants
        const dsNameVariants = ['DSNAME', 'DSNAMEF', 'DSNAMEFM', 'DSNAMEPQ', 'DSNAMEQ'];
        if (dsNameVariants.includes(keyword)) {
            parser.advance();
            return { type: keyword as VerType };
        }

        // Handle simple keywords
        const simpleKeywords = [
            'NONBLANK', 'NB', 'ALPHA', 'ALPHAB', 'BIT', 'DBCS', 'EBCDIC', 'ENUM',
            'FILEID', 'HEX', 'IDATE', 'IMBLK', 'IPADDR4', 'ITIME', 'JDATE', 'JSTD',
            'MIX', 'NAME', 'NAMEF', 'NUM', 'STDDATE', 'STDTIME'
        ];
        if (simpleKeywords.includes(keyword)) {
            parser.advance();
            return { type: keyword as VerType };
        }

        parser.error(`Unknown VER parameter '${keyword}'`, token);
        parser.advance();
        return undefined;
    }

    /**
     * Parses parameters that require additional values/operands
     */
    private static parseParameterWithValues(parser: Parser, keyword: string): VerParameter {
        const param: VerParameter = { type: keyword as VerType };

        switch (keyword) {
            case 'LEN':
                return VerStatementParser.parseLenParameter(parser, param);
            case 'PICT':
                return VerStatementParser.parsePictParameter(parser, param);
            case 'PICTCN':
                return VerStatementParser.parsePictcnParameter(parser, param);
            case 'RANGE':
                return VerStatementParser.parseRangeParameter(parser, param);
            case 'LIST':
            case 'LISTX':
                return VerStatementParser.parseListParameter(parser, param);
            case 'LISTV':
            case 'LISTVX':
                return VerStatementParser.parseListVParameter(parser, param);
            case 'INCLUDE':
                return VerStatementParser.parseIncludeParameter(parser, param);
            default:
                return param;
        }
    }

    /**
     * Parses LEN parameter: LEN, relational-operator, expected-length
     * Example: VER(&NAME,LEN,'<=',8)
     */
    private static parseLenParameter(parser: Parser, param: VerParameter): VerParameter {
        // Expect relational operator: =, <, >, <=, >=, ¬=, ¬>, ¬<, or their text equivalents
        parser.matchComma();
        
        const relOpToken = parser.current;
        let relOp = relOpToken.value?.toUpperCase() ?? '';
        
        // Handle quoted operators
        if (relOpToken.type === TokenType.String) {
            relOp = relOpToken.value ?? '';
        }
        
        parser.advance();
        param.relationalOp = relOp;

        // Expect expected length value
        parser.matchComma();
        const expectedToken = parser.current;
        param.expectedValue = expectedToken.value ?? '';
        parser.advance();

        return param;
    }

    /**
     * Parses PICT parameter: PICT, picture-string
     * Example: VER(xxx,PICT,'A/NNN')
     */
    private static parsePictParameter(parser: Parser, param: VerParameter): VerParameter {
        parser.matchComma();
        
        const pictToken = parser.current;
        param.value = pictToken.value ?? '';
        parser.advance();

        return param;
    }

    /**
     * Parses PICTCN parameter: PICTCN, mask-character, field-mask, string
     * Example: VER(&fld1,PICTCN,'¬','V¬¬R¬¬M¬¬','VNNRNNMNN')
     */
    private static parsePictcnParameter(parser: Parser, param: VerParameter): VerParameter {
        parser.matchComma();
        
        // mask-character
        const maskToken = parser.current;
        const maskChar = maskToken.value ?? '';
        parser.advance();

        parser.matchComma();
        
        // field-mask
        const fieldMaskToken = parser.current;
        const fieldMask = fieldMaskToken.value ?? '';
        parser.advance();

        parser.matchComma();
        
        // string
        const stringToken = parser.current;
        param.value = stringToken.value ?? '';
        parser.advance();

        // Store mask info in a structured way
        param.variable = `${maskChar}|${fieldMask}`;

        return param;
    }

    /**
     * Parses RANGE parameter: RANGE, lower, upper
     * Example: VER(&VAL,RANGE,1,100)
     */
    private static parseRangeParameter(parser: Parser, param: VerParameter): VerParameter {
        parser.matchComma();
        
        const lowerToken = parser.current;
        const lower = lowerToken.value ?? '';
        parser.advance();

        parser.matchComma();
        
        const upperToken = parser.current;
        const upper = upperToken.value ?? '';
        parser.advance();

        param.values = [lower, upper];
        return param;
    }

    /**
     * Parses LIST or LISTX parameter: LIST, value1, value2, ...
     * Can have up to 100 values
     */
    private static parseListParameter(parser: Parser, param: VerParameter): VerParameter {
        const values: string[] = [];

        // Match the first comma after LIST/LISTX keyword
        parser.matchComma();

        // Parse values separated by commas until we hit the closing paren or end
        while (!parser.isAtEnd() && !VerStatementParser.checkParenthesis(parser, ')')) {
            const valueToken = parser.current;
            const value = valueToken.value ?? '';
            
            if (value) {
                values.push(value);
            }
            parser.advance();

            // Check if there's another value coming
            if (VerStatementParser.checkComma(parser)) {
                parser.advance(); // consume comma and continue to next value
            } else if (VerStatementParser.checkParenthesis(parser, ')')) {
                // End of LIST parameters
                break;
            } else {
                // No comma found, but not at closing paren - might be unexpected
                break;
            }
        }

        param.values = values;
        return param;
    }

    /**
     * Parses LISTV or LISTVX parameter: LISTV, variable-name
     * The variable contains the list of values
     */
    private static parseListVParameter(parser: Parser, param: VerParameter): VerParameter {
        parser.matchComma();
        
        const varToken = parser.current;
        param.variable = varToken.value ?? '';
        parser.advance();

        return param;
    }

    /**
     * Parses INCLUDE parameter: INCLUDE, [IMBLK], value1, [value2]
     * INCLUDE can be combined with ALPHA, ALPHAB, or NUM
     */
    private static parseIncludeParameter(parser: Parser, param: VerParameter): VerParameter {
        const values: string[] = [];

        // INCLUDE can be followed by optional IMBLK and then type keywords
        while (!parser.isAtEnd() && !VerStatementParser.checkParenthesis(parser, ')') && !parser.check(TokenType.NewLine)) {
            const token = parser.current;
            const keyword = token.value?.toUpperCase() ?? '';

            // Stop if we hit another comma-separated parameter
            if (VerStatementParser.checkComma(parser)) {
                parser.advance();
                // Look ahead to see if next token is a new parameter (not part of INCLUDE values)
                const nextKeyword = parser.current.value?.toUpperCase() ?? '';
                if (!['ALPHA', 'ALPHAB', 'NUM', 'IMBLK'].includes(nextKeyword)) {
                    break;
                }
            }

            if (['IMBLK', 'ALPHA', 'ALPHAB', 'NUM'].includes(keyword)) {
                values.push(keyword);
                parser.advance();
            } else {
                break;
            }
        }

        param.values = values;
        return param;
    }

    /**
     * Helper to check if current token is a comma (used in list parsing)
     */
    private static checkComma(parser: Parser): boolean {
        return parser.current.type === TokenType.Operator && parser.current.value === ',';
    }

    /**
     * Helper to check if current token is a specific parenthesis
     */
    private static checkParenthesis(parser: Parser, paren: string): boolean {
        return parser.current.type === TokenType.Parenthesis && parser.current.value === paren;
    }
}