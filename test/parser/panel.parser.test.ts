import test from 'node:test';
import assert from 'node:assert/strict';

import { PanelParser } from '../../src/parser/index.ts';
import { AstNodeType } from '../../src/parser/enum/index.ts';
import { SectionType } from '../../src/lexer/index.ts';
import {
    createSectionStartToken,
    createAttributeCharToken,
    createAttributeKeywordToken,
    createAttributeValueToken,
    createTextToken,
    createVariableToken,
    createNewLineToken,
    createEOFToken,
    createTokenSequence,
    createIdentifierToken,
    createOperatorToken,
    createNumberToken
} from './testHelpers.ts';

test('PanelParser - parses empty panel', () => {
    const tokens = [createEOFToken()];
    const parser = new PanelParser(tokens);

    const result = parser.parse();

    assert.strictEqual(result.ast.type, AstNodeType.Panel);
    assert.strictEqual(result.ast.sections.length, 0);
    assert.strictEqual(result.diagnostics.length, 0);
});

test('PanelParser - parses single ATTR section', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('BLUE'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.ATTR);
    assert.strictEqual(result.ast.sections[0].statements.length, 1);
});

test('PanelParser - parses single BODY section', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Hello World'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.BODY);
});

test('PanelParser - parses single PROC section', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('IF'),
        createIdentifierToken('condition'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.PROC);
});

test('PanelParser - parses multiple sections', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Content'),
        createNewLineToken(),
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('statement'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 3);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.ATTR);
    assert.strictEqual(result.ast.sections[1].sectionType, SectionType.BODY);
    assert.strictEqual(result.ast.sections[2].sectionType, SectionType.PROC);
});

test('PanelParser - ATTR definitions available to BODY section', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('RED'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Styled text'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
    // The body parser should have access to the attributes defined in ATTR
    assert.strictEqual(result.diagnostics.length, 0);
});

test('PanelParser - complex panel structure', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('BLUE'),
        createNewLineToken(),
        createAttributeCharToken('B'),
        createAttributeKeywordToken('INTENS'),
        createAttributeValueToken('HIGH'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Welcome'),
        createNewLineToken(),
        createVariableToken('USERNAME'),
        createNewLineToken(),
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('PROCESS'),
        createIdentifierToken('DATA'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 3);
    assert.strictEqual(result.ast.sections[0].statements.length, 2); // 2 attribute definitions
    assert(result.ast.sections[1].statements.length > 0); // Body statements
    assert(result.ast.sections[2].statements.length > 0); // Proc statements
});

test('PanelParser - preserves section order', () => {
    const tokens = [
        createSectionStartToken(SectionType.PROC),
        createIdentifierToken('FIRST'),
        createNewLineToken(),
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('X'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('LAST'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.PROC);
    assert.strictEqual(result.ast.sections[1].sectionType, SectionType.ATTR);
    assert.strictEqual(result.ast.sections[2].sectionType, SectionType.BODY);
});

test('PanelParser - returns diagnostics for errors', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeKeywordToken('INVALID'), // Missing attribute char
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert(result.diagnostics.length > 0);
});

test('PanelParser - accumulates diagnostics from all sections', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeKeywordToken('ERROR1'), // Error
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createNewLineToken(),
        createSectionStartToken(SectionType.PROC),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    // Should have diagnostics from ATTR parsing
    assert(result.diagnostics.length > 0);
});

test('PanelParser - handles repeated sections', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Body1'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Body2'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.BODY);
    assert.strictEqual(result.ast.sections[1].sectionType, SectionType.BODY);
});

test('PanelParser - skips leading newlines', () => {
    const tokens = [
        createNewLineToken(),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Content'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
});

test('PanelParser - skips trivia between sections', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createNewLineToken(),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Text'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
});

test('PanelParser - section location is preserved', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert(result.ast.sections[0].location);
    assert.strictEqual(typeof result.ast.sections[0].location.line, 'number');
});

test('PanelParser - returns ParserResult with ast and diagnostics', () => {
    const tokens = [createSectionStartToken(SectionType.BODY), createTextToken('Test'), createEOFToken()];
    const parser = new PanelParser(tokens);

    const result = parser.parse();

    assert(result);
    assert.strictEqual(typeof result.ast, 'object');
    assert(Array.isArray(result.diagnostics));
});

test('PanelParser - multiple attributes and body content', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('R'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('RED'),
        createNewLineToken(),
        createAttributeCharToken('G'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('GREEN'),
        createNewLineToken(),
        createAttributeCharToken('B'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('BLUE'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Multi-color panel content'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
    assert.strictEqual(result.ast.sections[0].statements.length, 3);
});
