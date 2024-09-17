export type TokenType = string;

type KeywordKey = keyof typeof keywords;

export type Token = {
    type: TokenType;
    literal: string;
};

export enum TokenItem {
    ILLEGAL = "ILLEGAL",
    EOF = "EOF",
    IDENT = "IDENT",
    INT = "INT",
    STRING = "STRING",
    ASSIGN = "=",
    PLUS = "+",
    MINUS = "-",
    BANG = "!",
    ASTERISK = "*",
    SLASH = "/",
    LT = "<",
    GT = ">",
    EQ = "==",
    NOT_EQ = "!=",
    COMMA = ",",
    SEMICOLON = ";",
    LPAREN = "(",
    RPAREN = ")",
    LBRACE = "{",
    RBRACE = "}",
    LBRACKET = "[",
    RBRACKET = "]",
    COLON = ":",
    FUNCTION = "FUNCTION",
    LET = "LET",
    TRUE = "TRUE",
    FALSE = "FALSE",
    IF = "IF",
    ELSE = "ELSE",
    RETURN = "RETURN",
    FOR = "FOR",
}

enum keywords {
    fn = TokenItem.FUNCTION,
    let = TokenItem.LET,
    true = TokenItem.TRUE,
    false = TokenItem.FALSE,
    if = TokenItem.IF,
    else = TokenItem.ELSE,
    return = TokenItem.RETURN,
    for = TokenItem.FOR,
}

export function lookupIdent(ident: string): TokenType {
    if (Object.hasOwn(keywords, ident)) {
        return keywords[ident as KeywordKey];
    }

    return TokenItem.IDENT;
}
