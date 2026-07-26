import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PanelLexer } from '../src/lexer/panel.lexer.ts';
import { SectionType } from '../src/lexer/enum/section.enum.ts';
import { TokenType } from '../src/lexer/enum/token.enum.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('PanelLexer can tokenize a sample panel definition from disk', () => {
  const panelPath = path.resolve(__dirname, 'assets', 'sample-panel.pnl');
  const lexer = new PanelLexer();
  const tokens = lexer.lexFile(panelPath, { encoding: 'utf8', flag: 'r' });

  assert.ok(tokens.length > 0);
  assert.ok(tokens.some((token) => token.type === TokenType.AttributeKeyword));
  assert.ok(tokens.some((token) => token.type === TokenType.Text));
  assert.ok(tokens.some((token) => token.type === TokenType.NewLine));
});

test('PanelLexer detects section names and routes to the matching lexer', () => {
  const source = [')ATTR', '@ TYPE(TEXT)', ')BODY', 'Hello &ZCMD', ')PROC', 'IF (&ZCMD = \'X\')'].join('\n');
  const tokens = new PanelLexer().lex(source);

  assert.ok(tokens.some((token) => token.type === TokenType.AttributeChar));
  assert.ok(tokens.some((token) => token.type === TokenType.Variable));
  assert.ok(tokens.some((token) => token.type === TokenType.ProcKeyword));
});
