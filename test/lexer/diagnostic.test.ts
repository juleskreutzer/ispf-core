import test from 'node:test';
import assert from 'node:assert/strict';

import { createErrorToken } from '../../src/lexer/diagnostic.ts';
import { TokenType } from '../../src/lexer/enum/token.enum.ts';

test('createErrorToken builds an error token with the right metadata', () => {
  const token = createErrorToken('Unexpected input', 4, 2, 'X');

  assert.equal(token.type, TokenType.Error);
  assert.equal(token.message, 'Unexpected input');
  assert.equal(token.value, 'X');
  assert.deepEqual(token.location, {
    line: 4,
    column: 2,
    length: 1
  });
});
