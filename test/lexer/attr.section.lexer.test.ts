import test from 'node:test';
import assert from 'node:assert/strict';

import { AttrKeyword } from '../../src/lexer/enum/attrKeyword.enum.ts';
import { TokenType } from '../../src/lexer/enum/token.enum.ts';
import { AttrSectionLexer } from '../../src/lexer/section/attr.section.lexer.ts';

test('AttrSectionLexer tokenizes known attribute keywords and values', () => {
  const tokens = new AttrSectionLexer(['@ TYPE(TEXT) COLOR(RED)', '+ INTENS(HI)'], 3).lex();

  assert.ok(tokens.some((token) => token.type === TokenType.AttributeChar));
  assert.ok(tokens.some((token) => token.type === TokenType.AttributeKeyword));
  assert.ok(tokens.some((token) => token.type === TokenType.AttributeValue));

  const keywordToken = tokens.find((token) => token.type === TokenType.AttributeKeyword);
  assert.ok(keywordToken);
  assert.equal(keywordToken?.keyword, AttrKeyword.TYPE);
});

test('AttrSectionLexer tracks invalid attribute characters as errors', () => {
  const tokens = new AttrSectionLexer(['X TYPE(TEXT)'], 1).lex();

  assert.ok(tokens.some((token) => token.type === TokenType.Error));
});
