import test from 'node:test';
import assert from 'node:assert/strict';

import { Parser } from '../src/parser/parser.ts';
import { TokenType } from '../src/lexer/enum/token.enum.ts';

class TestParser extends Parser {
  constructor(tokens: any[]) {
    super(tokens);
  }

  public run() {
    this.skipTrivia();
    return this.match(TokenType.Text);
  }

  public getCurrentToken() {
    return this.current;
  }
}

test('Parser base class exposes the current token and supports recovery', () => {
  const tokens = [
    { type: TokenType.Text, value: 'hello', location: { line: 1, column: 0, length: 5 } },
    { type: TokenType.NewLine, location: { line: 1, column: 5, length: 0 } },
    { type: TokenType.EOF, location: { line: 1, column: 6, length: 0 } }
  ];

  const parser = new TestParser(tokens as any);
  assert.equal(parser.getCurrentToken().type, TokenType.Text);
  assert.equal(parser.run()?.type, TokenType.Text);
  assert.equal(parser.hasDiagnostics, false);
});

test('Parser reports diagnostics when a token is expected but missing', () => {
  const parser = new TestParser([{ type: TokenType.EOF, location: { line: 1, column: 0, length: 0 } }] as any);
  const token = parser.consume(TokenType.Text, 'Expected a text token');

  assert.equal(token, undefined);
  assert.equal(parser.hasDiagnostics, true);
  assert.equal(parser.diagnostics[0]?.message, 'Expected a text token');
});
