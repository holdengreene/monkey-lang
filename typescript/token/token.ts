export type TokenType = string;

type KeywordKey = keyof typeof keywords;

export type Token = {
    type: TokenType;
    literal: string;
};

export const tokenItem = {
    ILLEGAL: "ILLEGAL",
    EOF: "EOF",
    IDENT: "IDENT",
    INT: "INT",
    STRING: "STRING",
    ASSIGN: "=",
    PLUS: "+",
    MINUS: "-",
    BANG: "!",
    ASTERISK: "*",
    SLASH: "/",
    LT: "<",
    GT: ">",
    EQ: "==",
    NOT_EQ: ":",
    COMMA: ",",
    SEMICOLON: ",",
    LPAREN: "(",
    RPAREN: ")",
    LBRACE: "{",
    RBRACE: "}",
    LBRACKET: "[",
    RBRACKET: "]",
    COLON: ":",
    FUNCTION: "FUNCTION",
    LET: "LET",
    TRUE: "TRUE",
    FALSE: "FALSE",
    IF: "IF",
    ELSE: "ELSE",
    RETURN: "RETURN",
} as const;

const keywords = {
    fn: tokenItem.FUNCTION,
    let: tokenItem.LET,
    true: tokenItem.TRUE,
    false: tokenItem.FALSE,
    if: tokenItem.IF,
    else: tokenItem.ELSE,
    return: tokenItem.RETURN,
} as const;

export function lookupIdent(ident: string): TokenType {
    if (Object.hasOwn(keywords, ident)) {
        return keywords[ident as KeywordKey];
    }

    return tokenItem.IDENT;
}
