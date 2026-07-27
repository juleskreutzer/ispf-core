import test from 'node:test';
import assert from 'node:assert/strict';

import { TokenStream } from '../src/parser/tokenStream.ts';
import { TokenType } from '../src/lexer/enum/token.enum.ts';

const sampleTokens = [
  { type: TokenType.Text, value: 'A', location: { line: 1, column: 0, length: 1 } },
  { type: TokenType.NewLine, location: { line: 1, column: 1, length: 0 } },
  { type: TokenType.EOF, location: { line: 1, column: 2, length: 0 } }
];

test('TokenStream exposes the current position and supports advancing', () => {
  const stream = new TokenStream(sampleTokens as any);

  assert.equal(stream.currentPosition, 0);
  assert.equal(stream.peek().type, TokenType.Text);

  const token = stream.advance();
  assert.equal(token.type, TokenType.Text);
  assert.equal(stream.currentPosition, 1);
});

test('TokenStream can save and restore positions and match tokens', () => {
  const stream = new TokenStream(sampleTokens as any);
  const position = stream.save();

  assert.equal(stream.match(TokenType.Text), sampleTokens[0]);
  stream.restore(position);
  assert.equal(stream.currentPosition, position);
  assert.equal(stream.check(TokenType.Text), true);
});
