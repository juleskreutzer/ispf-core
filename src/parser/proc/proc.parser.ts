import { Parser } from '../index.ts';
import { TokenType } from '../../lexer/index.ts';
import { AstNodeType } from '../enum/index.ts';
import type { Token } from '../../lexer/index.ts';
import type { ProcExpressionNode, ErrorNode, ProcStatementNode } from '../interface/index.ts';

export type ProcStatement = ProcStatementNode | ErrorNode

const BUILTIN_FUNCTION_NAMES = new Set([
    'TRUNC', 'TRANS', 'PFK', 'LENGTH', 'UPPER', 'LVLINE', 'ADDSOSI', 'DELSOSI', 'ONEBYTE', 'TWOBYTE'
]);
const LOGICAL_OPERATORS = new Set(['AND', 'OR']);
const PREFIX_OPERATORS = new Set(['NOT', '-', '¬']);

export class ProcParser extends Parser {
    constructor(tokens: Token[]) {
        super(tokens);
    }

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
            command: command.type === TokenType.ProcCommand
                ? { type: AstNodeType.ProcKeyword, keyword: command.value ?? '', location: command.location }
                : { type: AstNodeType.Identifier, name: command.value ?? '', location: command.location },
            argument: args,
            location: first.location
        };
    }

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

    private currentOperator(): Token | undefined {
        if (this.check(TokenType.Operator)) return this.current;
        if ((this.check(TokenType.Identifier) || this.check(TokenType.ProcKeyword)) && LOGICAL_OPERATORS.has((this.current.value ?? '').toUpperCase())) return this.current;
        return undefined;
    }

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

    private checkParenthesis(value: string): boolean { 
        return this.check(TokenType.Parenthesis) && this.current.value === value
    }

    private matchClosingParenthesis(): Token | undefined {
        return this.checkParenthesis(')') ? this.advance() : undefined;
    }

    private matchComma(): Token | undefined {
        return this.check(TokenType.Operator) && this.current.value === ',' ? this.advance() : undefined;
    }
}