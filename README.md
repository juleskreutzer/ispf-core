# ispf-core

ispf-core is a TypeScript library for interpreting ISPF panel definitions. It provides a pipeline for turning panel source into tokens, parsing those tokens into an AST, validating the parsed structure, and generating a layout model that can be used by a UI renderer.

## What the project does

The library is organized around four main stages:

1. Lexing
   - Breaks raw panel source into structured tokens.
2. Parsing
   - Converts tokens into an AST that represents the panel structure.
3. Validation
   - Checks the parsed panel for consistency and common issues.
4. Layout generation
   - Produces a simplified layout representation suitable for rendering panels.

This libarary currently support the `ATTR`, `BODY` and (partially) `PROC` sections.

## Installation

Install from npm:

```bash
npm install ispf-core
```

## Quick start

The following example uses the sample panel included in the repository.

```ts
import { readFileSync } from 'node:fs';
import { PanelLexer, PanelParser, PanelValidator, PanelLayoutGenerator } from 'ispf-core';

const source = readFileSync('./test/assets/sample-panel.pnl', 'utf8');
```

## Lexing

Use the lexer to turn panel source text into tokens.

```ts
import { PanelLexer } from 'ispf-core';

const lexer = new PanelLexer();
const tokens = lexer.lex(source);

console.log(tokens);
```

You can also lex from a file path:

```ts
const tokensFromFile = lexer.lexFile('./test/assets/sample-panel.pnl', {
  encoding: 'utf8',
  flag: 'r'
});
```
> Second argument containing `encoding` and `flag` is optional

## Parsing

Feed the tokens into the parser to build an AST.

```ts
import { PanelLexer, PanelParser } from 'ispf-core';

const lexer = new PanelLexer();
const parser = new PanelParser(lexer.lex(source));
const result = parser.parse();

console.log(result.ast); // Containing the AST tree per section
console.log(result.diagnostics); // Any diagnostics that are reported during parsing
```

## Validation

Validate the parsed panel result to inspect diagnostics and gather attribute/variable information.

```ts
import { PanelLexer, PanelParser, PanelValidator } from 'ispf-core';

const lexer = new PanelLexer();
const parser = new PanelParser(lexer.lex(source));
const parserResult = parser.parse();

const validator = new PanelValidator(parserResult);
const validatedPanel = validator.validate();

console.log(validatedPanel.ast); // Containing the AST tree per section
console.log(validatedPanel.diagnostics); // Any diagnostics that are reported during parsing and validation
console.log(validatedPanel.body.attributes); // Map containing referenced attributes from the BODY section
console.log(validatedPanel.body.variables); // Map containing referenced variables from the PROC section
```

## Layout generation

Once the panel has been validated, you can generate a layout model for rendering.

```ts
import { PanelLexer, PanelParser, PanelValidator, PanelLayoutGenerator } from 'ispf-core';

const lexer = new PanelLexer();
const parser = new PanelParser(lexer.lex(source));
const parserResult = parser.parse();

const validator = new PanelValidator(parserResult);
const validatedPanel = validator.validate();

const layoutGenerator = new PanelLayoutGenerator(validatedPanel);
const layout = layoutGenerator.generate();

console.log(layout); // Layout representation containing for each BODY line the text fields and input fields
```

## Sample panel

The repository includes a sample panel at [test/assets/sample-panel.pnl](test/assets/sample-panel.pnl):

```text
)ATTR
@ TYPE(TEXT) COLOR(RED)
+ INTENS(HI)
)BODY
%Type your command ===> _ZCMD
)PROC
IF (&ZCMD = 'X')
```

## Notes

- The library currently focuses on parsing and analyzing panel source rather than executing ISPF logic. PR's welcome!
- The public API is exported from the package entry point, so you can import the main features directly from `ispf-core`.

This project is an independent implementation of the IBM ISPF panel language. The implementation was developed from publicly available IBM documentation. IBM and ISPF are trademarks of International Business Machines Corporation. This project is not affiliated with or endorsed by IBM.
