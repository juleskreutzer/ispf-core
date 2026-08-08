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
    createNewLineToken,
    createEOFToken,
} from './testHelpers.ts';
import type { AttributeDefinitionNode, AttributeOptionNode } from '../../src/parser/index.ts';
import { AttrKeyword } from '../../src/lexer/index.ts';

test('ATTR Section - parses empty attribute section', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert.strictEqual(result.ast.sections[0].sectionType, SectionType.ATTR);
    assert.strictEqual(result.ast.sections[0].statements.length, 0);
    assert.strictEqual(result.diagnostics.length, 0);
});

test('ATTR Section - parses single attribute definition', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual(section.statements[0].type, AstNodeType.AttributeDefinition);
    assert.strictEqual((section.statements[0] as AttributeDefinitionNode).attributeChar, 'A');
});

test('ATTR Section - parses attribute with keyword option', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('B'),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    const attrDef = section.statements[0];
    assert.strictEqual(attrDef.type, AstNodeType.AttributeDefinition);
    assert.strictEqual((attrDef as AttributeDefinitionNode).options.length, 1);
    assert.strictEqual((attrDef as AttributeDefinitionNode).options[0].type, AstNodeType.AttributeOption);
});

test('ATTR Section - parses attribute with keyword and value', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('C'),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createAttributeValueToken('RED'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    const attrDef = section.statements[0];
    assert.strictEqual((attrDef as AttributeDefinitionNode).options.length, 1);
    assert.strictEqual(((attrDef as AttributeDefinitionNode).options[0] as AttributeOptionNode).keyword, AttrKeyword.COLOR);
});

test('ATTR Section - parses multiple attribute definitions', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('A'),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createAttributeValueToken('BLUE'),
        createNewLineToken(),
        createAttributeCharToken('B'),
        createAttributeKeywordToken(AttrKeyword.INTENS),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 2);
    assert.strictEqual((section.statements[0] as AttributeDefinitionNode).attributeChar, 'A');
    assert.strictEqual((section.statements[1] as AttributeDefinitionNode).attributeChar, 'B');
});

test('ATTR Section - skips newlines between options', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('D'),
        createNewLineToken(),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createNewLineToken(),
        createAttributeValueToken('GREEN'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert.strictEqual((section.statements[0] as AttributeDefinitionNode).options.length, 1);
});

test('ATTR Section - creates error when attribute char is missing', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeKeywordToken('COLOR'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(result.diagnostics.length > 0, true);
    assert.strictEqual(section.statements[0].type, AstNodeType.Error);
});

test('ATTR Section - handles value without keyword', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('E'),
        createAttributeValueToken('RED'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    // Value without keyword should create an error node
    assert(result.diagnostics.length > 0);
});

test('ATTR Section - parses attribute with multiple options', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('F'),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createAttributeValueToken('YELLOW'),
        createAttributeKeywordToken(AttrKeyword.INTENS),
        createAttributeValueToken('HIGH'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert((section.statements[0] as AttributeDefinitionNode).options.length >= 1);
});

test('ATTR Section - stops parsing at next attribute char', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('G'),
        createAttributeKeywordToken(AttrKeyword.COLOR),
        createNewLineToken(),
        createAttributeCharToken('H'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 2);
    assert.strictEqual((section.statements[0] as AttributeDefinitionNode).attributeChar, 'G');
    assert.strictEqual((section.statements[1] as AttributeDefinitionNode).attributeChar, 'H');
});

test('ATTR Section - diagnostics accumulated for all errors', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeKeywordToken('INVALID'),
        createAttributeCharToken('X'),
        createAttributeValueToken('NO_KEYWORD'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    assert(result.diagnostics.length > 0);
});

test('ATTR Section - locates errors correctly', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('Z'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    assert.strictEqual(section.statements.length, 1);
    assert(section.statements[0].location);
});

test('ATTR Section - preserves location information', () => {
    const tokens = [
        createSectionStartToken(SectionType.ATTR),
        createAttributeCharToken('M'),
        createEOFToken()
    ];

    const parser = new PanelParser(tokens);
    const result = parser.parse();

    assert.strictEqual(result.ast.sections.length, 1);
    const section = result.ast.sections[0];
    const attrDef = section.statements[0];
    assert(attrDef.location);
    assert.strictEqual(typeof attrDef.location.line, 'number');
    assert.strictEqual(typeof attrDef.location.column, 'number');
});
