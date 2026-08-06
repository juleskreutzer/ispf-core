import { Parser } from '../parser.ts';
import { TokenType } from '../../lexer/index.ts';
import { AstNodeType } from '../enum/index.ts';
import { VerStatementParser } from './statements/ver.statement.parser.ts';
import type { Token } from '../../lexer/index.ts';
import type { ProcExpressionNode } from '../interface/index.ts';
import type { ProcStatement } from '../../shared/index.ts';

const BUILTIN_FUNCTION_NAMES = new Set([
    'TRUNC', 'TRANS', 'PFK', 'LENGTH', 'UPPER', 'LVLINE', 'ADDSOSI', 'DELSOSI', 'ONEBYTE', 'TWOBYTE'
]);
const LOGICAL_OPERATORS = new Set(['AND', 'OR']);
const PREFIX_OPERATORS = new Set(['NOT', '-', '¬']);

/**
 * Parses PROC sections into expressions, statements, and function calls.
 */
export class ProcParser extends Parser {
    /**
     * Creates a processor parser for the supplied token stream.
     *
     * @param tokens The tokens representing the PROC section.
     */
    constructor(tokens: Token[]) {
        super(tokens);
    }

    /**
     * Parses all PROC statements in the current section.
     *
     * @returns Parsed PROC statements.
     */
    parse(): ProcStatement[] {
        const statements: ProcStatement[] = [];

        while(!this.isAtEnd()) {
            this.skipTrivia();
            if (this.isAtEnd()) break;

            const statement = this.parseStatement();
            if (statement) statements.push(statement);
        }

        return statements;
    }

    /**
     * Parses a single PROC statement from the current stream.
     *
     * @returns A PROC statement node or an error node.
     */
    private parseStatement(): ProcStatement | undefined {
        const first = this.current;
        if ((this.check(TokenType.Variable) || this.check(TokenType.Identifier)) && this.check(TokenType.Operator, 1) && this.peek(1).value === '=') {
            const assignment = this.parseExpression();
            this.match(TokenType.NewLine);

            return {
                type: AstNodeType.ProcStatement,
                argument: assignment ? [assignment] : [],
                location: first.location
            };
        }

        const command = this.match(TokenType.ProcKeyword, TokenType.Identifier);
        if (!command) {
            const error = this.errorNode(`Expected PROC statement but found '${this.current.type}'`);
            this.recover({ consumeSynchronizationToken: true });
            return error;
        }

        // Handle specific command implementations
        if (command.value && command.value.toUpperCase() === 'VER') {
            // Handle VERify command with dedicated parser
            return VerStatementParser.parse(this, command);
        }

        const args: ProcExpressionNode[] = [];
        while(!this.isAtEnd() && !this.check(TokenType.NewLine) && !this.check(TokenType.SectionStart)) {
            const expression = this.parseExpression();
            if (expression) {
                args.push(expression);
            } else {
                args.push(this.errorNode(`Unexpected token in PROC statement '${this.current.type}'`));
                this.advance();
            }

            this.matchComma();
        }

        this.match(TokenType.NewLine);

        return {
            type: AstNodeType.ProcStatement,
            command: command.type === TokenType.ProcKeyword
                ? { type: AstNodeType.ProcKeyword, keyword: command.value ?? '', location: command.location }
                : { type: AstNodeType.Identifier, name: command.value ?? '', location: command.location },
            argument: args,
            location: first.location
        };
    }

    /**
     * Parses an expression using precedence-based parsing.
     *
     * @param minPrecedence The minimum precedence required for the next operator.
     * @returns A parsed expression node.
     */
    private parseExpression(minPrecedence = 0): ProcExpressionNode | undefined {
        let left = this.parsePrefix();
        if (!left) return undefined;

        while(!this.isAtEnd()) {
            const operator = this.currentOperator();
            if (!operator) break;

            const operatorValue = operator.value ?? '';
            const precedence = this.precedence(operatorValue);
            
            if (precedence < minPrecedence) break;
            this.advance();
            const right = this.parseExpression(precedence + 1)
            if (!right) {
                this.error(`Expected expression after operator '${operatorValue}'`, operator);
                break;
            }

            left = {
                type: AstNodeType.BinaryExpression,
                operator: operatorValue,
                left,
                right,
                location: left.location
            };
        }

        return left;
    }

    /**
     * Parses a prefix expression, including unary operators and parenthesized groups.
     *
     * @returns A parsed prefix expression node.
     */
    private parsePrefix(): ProcExpressionNode | undefined {
        const operator = this.currentOperator();
        if (operator) {
            const operatorValue = operator.value ?? '';
            if (PREFIX_OPERATORS.has(operatorValue.toUpperCase())) {
                this.advance();
                const operand = this.parseExpression(7);
                
                if (!operand) return this.errorNode(`Expected expression after unary operator '${operatorValue}'`, operator);
                return {
                    type: AstNodeType.UnaryExpression,
                    operator: operatorValue, 
                    operand,
                    location: operator.location
                };
            }
        }

        if (this.match(TokenType.Parenthesis) && this.previous?.value === '(') {
            const expression = this.parseExpression();
            if (!this.matchClosingParenthesis()) this.error(`Expected ')' to close expression`, this.current);
            return expression;
        }

        return this.parsePrimary();
    }

    /**
     * Parses the primary expression forms such as variables, literals, and identifiers.
     *
     * @returns A parsed primary expression node.
     */
    private parsePrimary(): ProcExpressionNode | undefined {
        const token = this.match(TokenType.Variable, TokenType.String, TokenType.Text, TokenType.Number, TokenType.ProcKeyword, TokenType.Identifier);

        if (!token) return undefined;

        if ((token.type === TokenType.Identifier || token.type === TokenType.ProcKeyword) && this.checkParenthesis('(')) {
            const caller = token.value ?? '';
            this.advance();
            const args: ProcExpressionNode[] = [];
            while(!this.isAtEnd() && !this.checkParenthesis(')')) {
                const arg = this.parseExpression();
                if (arg) args.push(arg);
                if (!this.matchComma()) break;
            }

            if (!this.matchClosingParenthesis()) this.error(`Expected ')' after '${caller}' arguments`, this.current);
            return {
                type: AstNodeType.FunctionCallExpression,
                name: caller,
                arguments: args,
                builtin: BUILTIN_FUNCTION_NAMES.has(caller.toUpperCase()),
                location: token.location
            };
        }

        switch(token.type) {
            case TokenType.Variable:
                return { type: AstNodeType.VariableReference, value: token.value ?? '', location: token.location };
            case TokenType.String:
            case TokenType.Text:
                return { type: AstNodeType.StringLiteral, value: token.value ?? '', location: token.location };
            case TokenType.Number:
                return { type: AstNodeType.NumberLiteral, value: token.value ?? '', location: token.location };
            case TokenType.ProcKeyword:
                return { type: AstNodeType.ProcKeyword, keyword: token.value ?? '', location: token.location };
            default:
                return { type: AstNodeType.Identifier, name: token.value ?? '', location: token.location };
        }
    }

    /**
     * Returns the current operator token when one is present.
     *
     * @returns The current operator token, or undefined.
     */
    private currentOperator(): Token | undefined {
        if (this.check(TokenType.Operator)) return this.current;
        if ((this.check(TokenType.Identifier) || this.check(TokenType.ProcKeyword)) && LOGICAL_OPERATORS.has((this.current.value ?? '').toUpperCase())) return this.current;
        return undefined;
    }

    /**
     * Computes the precedence of a PROC operator.
     *
     * @param operator The operator string to evaluate.
     * @returns The operator precedence value.
     */
    private precedence(operator: string): number {
        switch(operator.toUpperCase()) {
            case '=':
            case '<>':
            case '<':
            case '<=':
            case '>':
            case '>=':
            case 'EQ':
            case 'NE': 
            case 'LT':
            case 'LE':
            case 'GT':
            case 'GE':
                return 1;
            case 'OR': 
                return 2;
            case 'AND':
                return 3;
            case '+':
            case '-':
                return 4;
            case '*':
            case '/':
                return 5;
            default:
                return 0;
        }
    }
}