export enum TokenType {
    SectionStart = "SectionStart",
    
    AttributeChar = "AttributeChar",
    AttributeKeyword = "AttributeKeyword",
    AttributeValue = "AttributeValue",

    BodyAttributeReference = "BodyAttributeReference",

    ProcCommand = "ProcCommand",
    ProcKeyword = "ProcKeyword",

    Identifier = "Identifier",
    String = "String",
    Variable = "Variable",

    Operator = "Operator",
    Number = "Number",
    Parenthesis = "Parenthesis",
    Comment = "Comment",
    Text = "Text",

    Error = "Error",

    NewLine = "NewLine",
    EOF = "EOF"
}