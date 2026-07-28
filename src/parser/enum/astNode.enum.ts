export enum AstNodeType {
    Panel = "Panel",
    Section = "Section",

    AttributeDefinition = "AttributeDefinition",
    AttributeOption = "AttributeOption",

    BodyLine = "BodyLine",
    BodyText = "BodyText",
    BodyAttributeReference = "BodyAttributeReference",
    VariableReference = "VariableReference",

    ProcStatement = "ProcStatement",
    ProcKeyword = "ProcKeyword",
    BinaryExpression = "BinaryExpression",
    UnaryExpression = "UnaryExpression",
    FunctionCallExpression = "FunctionCallExpression",
    Identifier = "Identifier",
    StringLiteral = "StringLiteral",
    NumberLiteral = "NumberLiteral",
    Operator = "Operator",
    Comment = "Comment",
    Text = "Text",
    Error = "Error"
}