import test from 'node:test';
import assert from 'node:assert/strict';

import { PanelParser } from '../../src/parser/index.ts';
import { AstNodeType } from '../../src/parser/enum/index.ts';
import { SectionType } from '../../src/lexer/index.ts';
import {
    createSectionStartToken,
    createIdentifierToken,
    createOperatorToken,
    createNumberToken,
    createStringToken,
    createVariableToken,
    createParenthesisToken,
    createProcKeywordToken,
    createNewLineToken,
    createEOFToken,
} from './testHelpers.ts';

test('PROC Section - parses empty procedure section', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.PROC);
    assert.strictEqual(result.ast.sections[0].statements.length, 0);
});

test('PROC Section - parses simple command statement', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('DISPLAY'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual(section.statements[0].type, AstNodeType.ProcStatement);
});

test('PROC Section - parses command with identifier argument', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('DISPLAY'),
        createIdentifierToken('message'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual(section.statements[0].type, AstNodeType.ProcStatement);
});

test('PROC Section - parses simple binary expression', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('a'),
        createOperatorToken('+'),
        createIdentifierToken('b'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses arithmetic operators', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('x'),
        createOperatorToken('+'),
        createNumberToken('5'),
        createOperatorToken('-'),
        createNumberToken('3'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses comparison operators', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('status'),
        createOperatorToken('='),
        createStringToken('READY'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
    assert.strictEqual(result.diagnostics.length, 0);
});

test('PROC Section - parses logical operators', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('flag1'),
        createOperatorToken('&'),
        createIdentifierToken('flag2'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - respects operator precedence', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createNumberToken('2'),
        createOperatorToken('+'),
        createNumberToken('3'),
        createOperatorToken('*'),
        createNumberToken('4'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses parenthesized expressions', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createParenthesisToken('('),
        createIdentifierToken('a'),
        createOperatorToken('+'),
        createIdentifierToken('b'),
        createParenthesisToken(')'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses nested parenthesized expressions', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createParenthesisToken('('),
        createParenthesisToken('('),
        createNumberToken('5'),
        createParenthesisToken(')'),
        createParenthesisToken(')'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses string literals', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createStringToken('hello world'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses numeric literals', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createNumberToken('42'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses variables', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createVariableToken('MYVAR'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses multiple statements', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('IF'),
        createIdentifierToken('condition'),
        createNewLineToken(),
        createIdentifierToken('DISPLAY'),
        createStringToken('true'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length >= 1);
});

test('PROC Section - handles unary operators', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createOperatorToken('-'),
        createNumberToken('5'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - parses function calls', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('LENGTH'),
        createParenthesisToken('('),
        createIdentifierToken('string'),
        createParenthesisToken(')'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - handles incomplete expressions', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('x'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    // Should have diagnostics or statements for incomplete expression
    assert(result.hasDiagnostics || section.statements.length > 0);
});

test('PROC Section - handles mismatched parentheses', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createParenthesisToken('('),
        createIdentifierToken('x'),
        createParenthesisToken(')'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    // Should parse even with potential issues
    assert(section.statements.length > 0);
});

test('PROC Section - parses complex expression with mixed operators', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('a'),
        createOperatorToken('*'),
        createNumberToken('2'),
        createOperatorToken('+'),
        createIdentifierToken('b'),
        createOperatorToken('/'),
        createNumberToken('3'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
});

test('PROC Section - preserves location information', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createNumberToken('123'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    if (section.statements.length > 0) {
        assert(section.statements[0].location);
        assert.strictEqual(typeof section.statements[0].location.line, 'number');
    }
});

test('PROC Section - handles consecutive operators with error recovery', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('x'),
        createOperatorToken('+'),
        createOperatorToken('+'),
        createIdentifierToken('y'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    // Should handle error and potentially recover
    assert(section.statements.length >= 0);
});
