import test from 'node:test';
import assert from 'node:assert/strict';

import { SectionLexer } from '../../src/lexer/section.lexer.ts';

class TestSectionLexer extends SectionLexer {
  lex() {
    return [];
  }

  exposeState() {
    return {
      lines: this.lines,
      startLine: this.startLine
    };
  }
}

test('SectionLexer stores the provided source lines and start line', () => {
  const lexer = new TestSectionLexer(['alpha', 'beta'], 7);

  assert.deepEqual(lexer.exposeState(), {
    lines: ['alpha', 'beta'],
    startLine: 7
  });
});
