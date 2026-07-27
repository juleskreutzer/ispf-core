import test from 'node:test';
import assert from 'node:assert/strict';

import { TokenType } from '../../src/lexer/enum/token.enum.ts';
import { BodySectionLexer } from '../../src/lexer/section/body.section.lexer.ts';

test('BodySectionLexer tokenizes body text, variables and attribute references', () => {
  const tokens = new BodySectionLexer(['Hello &ZCMD', '+More && text'], 5).lex();

  assert.ok(tokens.some((token) => token.type === TokenType.Text));
  assert.ok(tokens.some((token) => token.type === TokenType.Variable));
  assert.ok(tokens.some((token) => token.type === TokenType.BodyAttributeReference));
  assert.ok(tokens.some((token) => token.type === TokenType.NewLine));
});
