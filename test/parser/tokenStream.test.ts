import test from 'node:test';
import assert from 'node:assert/strict';

import { TokenStream } from '../../src/parser/tokenStream.ts';
import { createIdentifierToken, createOperatorToken, createEOFToken, createNewLineToken } from './testHelpers.ts';

test('TokenStream - initialization', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createIdentifierToken('bar'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.currentPosition, 0);
    assert.strictEqual(stream.length, 4);
});

test('TokenStream - peek returns current token', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.peek().value, 'foo');
});

test('TokenStream - peek with positive offset', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createIdentifierToken('bar'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.peek(1).value, '+');
    assert.strictEqual(stream.peek(2).value, 'bar');
    assert.strictEqual(stream.peek(3).type, 'EOF');
});

test('TokenStream - peek with negative offset returns EOF', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.peek(-1).type, 'EOF');
});

test('TokenStream - peek beyond bounds returns EOF', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.peek(5).type, 'EOF');
});

test('TokenStream - advance moves cursor and returns previous token', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    const token = stream.advance();
    assert.strictEqual(token.value, 'foo');
    assert.strictEqual(stream.currentPosition, 1);
    assert.strictEqual(stream.peek().value, '+');
});

test('TokenStream - advance at EOF stays at EOF', () => {
    const tokens = [createEOFToken()];
    const stream = new TokenStream(tokens);

    stream.advance();
    assert.strictEqual(stream.isAtEnd(), true);
    assert.strictEqual(stream.peek().type, 'EOF');
});

test('TokenStream - previous returns token before current', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);
    stream.advance();

    const prev = stream.previous();
    assert.strictEqual(prev?.value, 'foo');
});

test('TokenStream - previous returns undefined at start', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.previous(), undefined);
});

test('TokenStream - isAtEnd returns true when at EOF', () => {
    const tokens = [createEOFToken()];
    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.isAtEnd(), true);
});

test('TokenStream - isAtEnd returns false when not at EOF', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.isAtEnd(), false);
});

test('TokenStream - check matches token type', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.check('Identifier'), true);
    assert.strictEqual(stream.check('Operator'), false);
});

test('TokenStream - check with offset matches token at offset', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createIdentifierToken('bar'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    assert.strictEqual(stream.check('Operator', 1), true);
    assert.strictEqual(stream.check('Identifier', 2), true);
    assert.strictEqual(stream.check('Operator', 2), false);
});

test('TokenStream - match consumes token when type matches', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    const matched = stream.match('Identifier');
    assert.strictEqual(matched?.value, 'foo');
    assert.strictEqual(stream.currentPosition, 1);
});

test('TokenStream - match returns undefined when type does not match', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    const matched = stream.match('Operator');
    assert.strictEqual(matched, undefined);
    assert.strictEqual(stream.currentPosition, 0);
});

test('TokenStream - match with multiple types consumes first match', () => {
    const tokens = [
        createOperatorToken('+'),
        createIdentifierToken('foo'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);

    const matched = stream.match('Identifier', 'Operator', 'Number');
    assert.strictEqual(matched?.value, '+');
    assert.strictEqual(matched?.type, 'Operator');
});

test('TokenStream - save and restore', () => {
    const tokens = [
        createIdentifierToken('foo'),
        createOperatorToken('+'),
        createIdentifierToken('bar'),
        createEOFToken()
    ];

    const stream = new TokenStream(tokens);
    stream.advance();
    stream.advance();

    const savedState = stream.save();
    assert.strictEqual(savedState, 2);

    stream.advance();
    assert.strictEqual(stream.currentPosition, 3);

    stream.restore(savedState);
    assert.strictEqual(stream.currentPosition, 2);
});

test('TokenStream - multiple streams are independent', () => {
    const tokens1 = [createIdentifierToken('foo'), createEOFToken()];
    const tokens2 = [createOperatorToken('+'), createEOFToken()];

    const stream1 = new TokenStream(tokens1);
    const stream2 = new TokenStream(tokens2);

    stream1.advance();

    assert.strictEqual(stream1.peek().type, 'EOF');
    assert.strictEqual(stream2.peek().value, '+');
});
