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
    createBodyAttributeReferenceToken,
    createNewLineToken,
    createEOFToken,
} from './testHelpers.ts';

test('BODY Section - parses empty body section', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.BODY);
    assert.strictEqual(result.ast.sections[0].statements.length, 0);
});

test('BODY Section - parses text content', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Hello World'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual(section.statements[0].type, AstNodeType.BodyLine);
    const line = section.statements[0];
    assert(line.content.length >= 1);
    assert.strictEqual(line.content[0].type, AstNodeType.BodyText);
    assert.strictEqual(line.content[0].value, 'Hello World');
});

test('BODY Section - parses multiple text lines', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Line 1'),
        createNewLineToken(),
        createTextToken('Line 2'),
        createNewLineToken(),
        createTextToken('Line 3'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length >= 3);
    assert(section.statements.every(s => s.type === AstNodeType.BodyLine));
});

test('BODY Section - parses variable reference', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createVariableToken('MYVAR'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual(section.statements[0].type, AstNodeType.BodyLine);
    const line = section.statements[0];
    assert(line.content.length >= 1);
    assert.strictEqual(line.content[0].type, AstNodeType.VariableReference);
    assert.strictEqual(line.content[0].value, 'MYVAR');
});

test('BODY Section - parses body attribute reference', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('RED'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createBodyAttributeReferenceToken('A'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
    const bodySection = result.ast.sections[1];
    assert.strictEqual(bodySection.statements.length, 1);
    assert.strictEqual(bodySection.statements[0].type, AstNodeType.BodyLine);
    const line = bodySection.statements[0];
    assert(line.content.length >= 1);
    assert.strictEqual(line.content[0].type, AstNodeType.BodyAttributeReference);
});

test('BODY Section - parses mixed content', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('S'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('BLUE'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Name: '),
        createVariableToken('NAME'),
        createTextToken(' Status: '),
        createBodyAttributeReferenceToken('S'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 2);
    const bodySection = result.ast.sections[1];
    assert(bodySection.statements.length >= 1);
    const line = bodySection.statements[0];
    assert.strictEqual(line.type, AstNodeType.BodyLine);
    assert(line.content.length >= 3);
    assert(line.content.some(c => c.type === AstNodeType.BodyText));
    assert(line.content.some(c => c.type === AstNodeType.VariableReference));
    assert(line.content.some(c => c.type === AstNodeType.BodyAttributeReference));
});

test('BODY Section - skips newlines', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createNewLineToken(),
        createNewLineToken(),
        createTextToken('Content'),
        createNewLineToken(),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length > 0);
    const contentLine = section.statements.find(s => 
        s.type === AstNodeType.BodyLine && 
        s.content.some(c => c.type === AstNodeType.BodyText)
    );
    assert(contentLine);
    const textNode = contentLine.content.find(c => c.type === AstNodeType.BodyText);
    assert.strictEqual(textNode?.value, 'Content');
});

test('BODY Section - preserves location information', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Test'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    const line = section.statements[0];
    assert(line.location);
    assert.strictEqual(typeof line.location.line, 'number');
});

test('BODY Section - parses consecutive variables', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createVariableToken('VAR1'),
        createVariableToken('VAR2'),
        createVariableToken('VAR3'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length >= 1);
    const line = section.statements[0];
    assert.strictEqual(line.type, AstNodeType.BodyLine);
    assert(line.content.length >= 3);
    assert(line.content.every(c => c.type === AstNodeType.VariableReference));
});

test('BODY Section - parses consecutive text', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createTextToken('Part1'),
        createTextToken('Part2'),
        createTextToken('Part3'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert(section.statements.length >= 1);
    const line = section.statements[0];
    assert.strictEqual(line.type, AstNodeType.BodyLine);
    // Multiple text tokens may be merged into fewer content items
    assert(line.content.length >= 1);
    assert(line.content.some(c => c.type === AstNodeType.BodyText));
});

test('BODY Section - handles empty variables', () => {
    const tokens = [
        createSectionStartToken(SectionType.BODY),
        createVariableToken(''),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    // Should still parse but may create error
    assert(section.statements.length >= 1);
});

test('BODY Section - no diagnostics for valid content', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('B'),
        createAttributeKeywordToken('COLOR'),
        createAttributeValueToken('GREEN'),
        createNewLineToken(),
        createSectionStartToken(SectionType.BODY),
        createTextToken('Valid text'),
        createVariableToken('VAR'),
        createBodyAttributeReferenceToken('B'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.diagnostics.length, 0);
});
