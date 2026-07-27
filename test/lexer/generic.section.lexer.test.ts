import test from 'node:test';
import assert from 'node:assert/strict';

import { TokenType } from '../../src/lexer/enum/token.enum.ts';
import { GenericSectionLexer } from '../../src/lexer/section/generic.section.lexer.ts';

test('GenericSectionLexer returns each line as plain text tokens', () => {
  const tokens = new GenericSectionLexer(['line one', 'line two'], 1).lex();

  assert.equal(tokens.length, 2);
  assert.deepEqual(tokens.map((token) => token.type), [TokenType.Text, TokenType.Text]);
  assert.deepEqual(tokens.map((token) => token.value), ['line one', 'line two']);
});
