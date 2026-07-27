import test from 'node:test';
import assert from 'node:assert/strict';

import { TokenType } from '../../src/lexer/enum/token.enum.ts';
import { ProcSectionLexer } from '../../src/lexer/section/proc.section.lexer.ts';

test('ProcSectionLexer tokenizes keywords, variables and operators', () => {
  const tokens = new ProcSectionLexer(['IF (&ZCMD = \'X\')', '/* comment */'], 2).lex();

  assert.ok(tokens.some((token) => token.type === TokenType.ProcKeyword));
  assert.ok(tokens.some((token) => token.type === TokenType.Variable));
  assert.ok(tokens.some((token) => token.type === TokenType.Operator));
  assert.ok(tokens.some((token) => token.type === TokenType.Comment));
});
