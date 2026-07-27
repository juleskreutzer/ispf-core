import test from 'node:test';
import assert from 'node:assert/strict';

import { createParserDiagnostic } from '../src/parser/diagnostic.ts';
import { TokenType } from '../src/lexer/enum/token.enum.ts';

test('createParserDiagnostic returns a parser diagnostic with the source token', () => {
  const token = {
    type: TokenType.Text,
    value: 'hello',
    location: { line: 2, column: 3, length: 5 }
  };

  const diagnostic = createParserDiagnostic('Unexpected token', token as any);

  assert.equal(diagnostic.message, 'Unexpected token');
  assert.equal(diagnostic.token.type, TokenType.Text);
  assert.deepEqual(diagnostic.location, token.location);
});
