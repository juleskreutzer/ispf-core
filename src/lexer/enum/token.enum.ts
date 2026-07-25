export enum TokenType {
    Keyword = "Keyword", /* type 0 */
    Identifier = "Identifier", /* type 1 */
    String = "String", /* type 2 */
    Variable = "Variable", /* type 3 */
    AttributeChar = "AttributeChar", /* type 4 */
    Operator = "Operator", /* type 5 */
    Number = "Number", /* type 6 */
    Comment = "Comment", /* type 7 */
    Text = "Text", /* type 8 */
    NewLine = "NewLine", /* type 9 */
    EOF = "EOF" /* type 10 */
}