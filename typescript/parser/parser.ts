import {
    ArrayLiteral,
    BlockStatement,
    BooleanLiteral,
    CallExpression,
    type Expression,
    ExpressionStatement,
    FunctionLiteral,
    HashLiteral,
    Identifier,
    IfExpression,
    IndexExpression,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Program,
    ReturnStatement,
    type Statement,
    StringLiteral,
} from "../ast/ast.js";
import type { Lexer } from "../lexer/Lexer.js";
import { type Token, TokenItem, type TokenType } from "../token/token.js";

type PrefixFn = () => Expression | undefined;
type InfixFn = (arg?: Expression) => Expression | undefined;

enum Operators {
    LOWEST,
    EQUALS,
    LESSGREATER,
    SUM,
    PRODUCT,
    PREFIX,
    CALL,
    INDEX,
}

const precedences = {
    [TokenItem.EQ]: Operators.EQUALS,
    [TokenItem.NOT_EQ]: Operators.EQUALS,
    [TokenItem.LT]: Operators.LESSGREATER,
    [TokenItem.GT]: Operators.LESSGREATER,
    [TokenItem.PLUS]: Operators.SUM,
    [TokenItem.MINUS]: Operators.SUM,
    [TokenItem.SLASH]: Operators.PRODUCT,
    [TokenItem.ASTERISK]: Operators.PRODUCT,
    [TokenItem.LPAREN]: Operators.CALL,
    [TokenItem.LBRACKET]: Operators.INDEX,
} as const;

type PrecedenceKey = keyof typeof precedences;

export class Parser {
    private errors: string[] = [];
    private curToken!: Token;
    private peekToken!: Token;
    private prefixParseFns = new Map<TokenType, PrefixFn>();
    private infixParseFns = new Map<TokenType, InfixFn>();

    constructor(private lexer: Lexer) {
        this.registerPrefix(TokenItem.IDENT, this.parseIdentifier);
        this.registerPrefix(TokenItem.INT, this.parseIntegerLiteral);
        this.registerPrefix(TokenItem.TRUE, this.parseBoolean);
        this.registerPrefix(TokenItem.FALSE, this.parseBoolean);
        this.registerPrefix(TokenItem.BANG, this.parsePrefixExpression);
        this.registerPrefix(TokenItem.MINUS, this.parsePrefixExpression);
        this.registerPrefix(TokenItem.LPAREN, this.parseGroupedExpression);
        this.registerPrefix(TokenItem.LBRACKET, this.parseArrayLiteral);
        this.registerPrefix(TokenItem.LBRACE, this.parseHashLiteral);
        this.registerPrefix(TokenItem.IF, this.parseIfExpression);
        this.registerPrefix(TokenItem.FUNCTION, this.parseFunctionLiteral);
        this.registerPrefix(TokenItem.STRING, this.parseStringLiteral);
        this.registerPrefix(TokenItem.LBRACKET, this.parseArrayLiteral);
        this.registerPrefix(TokenItem.LBRACE, this.parseHashLiteral);

        this.registerInfix(TokenItem.PLUS, this.parseInfixExpression);
        this.registerInfix(TokenItem.MINUS, this.parseInfixExpression);
        this.registerInfix(TokenItem.SLASH, this.parseInfixExpression);
        this.registerInfix(TokenItem.ASTERISK, this.parseInfixExpression);
        this.registerInfix(TokenItem.EQ, this.parseInfixExpression);
        this.registerInfix(TokenItem.NOT_EQ, this.parseInfixExpression);
        this.registerInfix(TokenItem.LT, this.parseInfixExpression);
        this.registerInfix(TokenItem.GT, this.parseInfixExpression);
        this.registerInfix(TokenItem.LPAREN, this.parseCallExpression);
        this.registerInfix(TokenItem.LBRACKET, this.parseIndexExpression);

        // Read two tokens, so curToken and peekToken are both set
        this.nextToken();
        this.nextToken();
    }

    public parseProgram(): Program {
        const program = new Program([]);

        while (!this.curTokenIs(TokenItem.EOF)) {
            const stmt = this.parseStatement();

            if (stmt) {
                program.statements.push(stmt);
            }

            this.nextToken();
        }

        return program;
    }

    public get getErrors(): string[] {
        return this.errors;
    }

    private nextToken(): void {
        this.curToken = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    private parseStatement(): Statement | undefined {
        switch (this.curToken.type) {
            case TokenItem.LET:
                return this.parseLetStatement();
            case TokenItem.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    private parseLetStatement(): LetStatement | undefined {
        const stmt = new LetStatement({
            token: this.curToken,
        });

        if (!this.expectPeek(TokenItem.IDENT)) {
            return undefined;
        }

        stmt.name = new Identifier({
            token: this.curToken,
            value: this.curToken.literal,
        });

        if (!this.expectPeek(TokenItem.ASSIGN)) {
            return undefined;
        }

        this.nextToken();

        stmt.value = this.parseExpression(Operators.LOWEST);

        if (this.peekTokenIs(TokenItem.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    private parseReturnStatement(): ReturnStatement {
        const stmt = new ReturnStatement({ token: this.curToken });

        this.nextToken();

        stmt.returnValue = this.parseExpression(Operators.LOWEST);

        if (this.peekTokenIs(TokenItem.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    private parseExpression(precedence: Operators): Expression | undefined {
        const prefix = this.prefixParseFns.get(this.curToken.type);

        if (!prefix) {
            this.noPrefixParseFnError(this.curToken.type);
            return undefined;
        }

        let leftExp = prefix();

        while (
            !this.peekTokenIs(TokenItem.SEMICOLON) &&
            precedence < this.peekPrecedence()
        ) {
            const infix = this.infixParseFns.get(this.peekToken.type);

            if (!infix) {
                return leftExp;
            }

            this.nextToken();

            leftExp = infix(leftExp);
        }

        return leftExp;
    }

    private parseExpressionStatement(): ExpressionStatement {
        const stmt = new ExpressionStatement({ token: this.curToken });

        stmt.expression = this.parseExpression(Operators.LOWEST);

        if (this.peekTokenIs(TokenItem.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    private parsePrefixExpression = (): PrefixExpression => {
        const expression = new PrefixExpression({
            token: this.curToken,
            operator: this.curToken.literal,
        });

        this.nextToken();

        expression.right = this.parseExpression(Operators.PREFIX);

        return expression;
    };

    private parseIdentifier = (): Identifier => {
        return new Identifier({
            token: this.curToken,
            value: this.curToken.literal,
        });
    };

    private parseIntegerLiteral = (): IntegerLiteral => {
        const lit = new IntegerLiteral({ token: this.curToken });

        const value = parseInt(this.curToken.literal);

        if (Number.isNaN(value)) {
            const msg = `could not parse ${this.curToken.literal} as integer`;
            this.errors.push(msg);
        }

        lit.value = value;
        return lit;
    };

    private parseBoolean = (): BooleanLiteral => {
        return new BooleanLiteral({
            token: this.curToken,
            value: this.curTokenIs(TokenItem.TRUE),
        });
    };

    private parseInfixExpression = (left?: Expression): InfixExpression => {
        const exp = new InfixExpression({
            token: this.curToken,
            operator: this.curToken.literal,
            left,
        });

        const precedence = this.curPrecedence();
        this.nextToken();
        exp.right = this.parseExpression(precedence);

        return exp;
    };

    private parseFunctionLiteral = (): FunctionLiteral | undefined => {
        const funcLit = new FunctionLiteral({ token: this.curToken });

        if (!this.expectPeek(TokenItem.LPAREN)) {
            return undefined;
        }

        funcLit.parameters = this.parseFunctionParameters();

        if (!this.expectPeek(TokenItem.LBRACE)) {
            return undefined;
        }

        funcLit.body = this.parseBlockStatement();

        return funcLit;
    };

    private parseFunctionParameters = (): Identifier[] | undefined => {
        const identifiers: Identifier[] = [];

        if (this.peekTokenIs(TokenItem.RPAREN)) {
            this.nextToken();
            return identifiers;
        }

        this.nextToken();

        const ident = new Identifier({
            token: this.curToken,
            value: this.curToken.literal,
        });
        identifiers.push(ident);

        while (this.peekTokenIs(TokenItem.COMMA)) {
            this.nextToken();
            this.nextToken();
            const ident = new Identifier({
                token: this.curToken,
                value: this.curToken.literal,
            });
            identifiers.push(ident);
        }

        if (!this.expectPeek(TokenItem.RPAREN)) {
            return undefined;
        }

        return identifiers;
    };

    private parseGroupedExpression = (): Expression | undefined => {
        this.nextToken();

        const exp = this.parseExpression(Operators.LOWEST);

        if (!this.expectPeek(TokenItem.RPAREN)) {
            return undefined;
        }

        return exp;
    };

    private parseCallExpression = (fn?: Expression): CallExpression => {
        const exp = new CallExpression({ token: this.curToken, function: fn });
        exp.arguments = this.parseExpressionList(TokenItem.RPAREN);

        return exp;
    };

    private parseExpressionList = (
        end: TokenType,
    ): Expression[] | undefined => {
        const list: Expression[] | undefined = [];

        if (this.peekTokenIs(end)) {
            this.nextToken();
            return list;
        }

        this.nextToken();
        const exp = this.parseExpression(Operators.LOWEST);

        if (exp) {
            list.push(exp);
        }

        while (this.peekTokenIs(TokenItem.COMMA)) {
            this.nextToken();
            this.nextToken();
            const iterExp = this.parseExpression(Operators.LOWEST);
            if (iterExp) {
                list.push(iterExp);
            }
        }

        if (!this.expectPeek(end)) {
            return undefined;
        }

        return list;
    };

    private parseArrayLiteral = (): ArrayLiteral => {
        const array = new ArrayLiteral({ token: this.curToken });

        array.elements = this.parseExpressionList(TokenItem.RBRACKET);

        return array;
    };

    private parseIndexExpression = (
        left?: Expression,
    ): IndexExpression | undefined => {
        const exp = new IndexExpression({ token: this.curToken, left });

        this.nextToken();
        exp.index = this.parseExpression(Operators.LOWEST);

        if (!this.expectPeek(TokenItem.RBRACKET)) {
            return undefined;
        }

        return exp;
    };

    private parseHashLiteral = (): HashLiteral | undefined => {
        const hash = new HashLiteral({ token: this.curToken });
        hash.pairs = new Map();

        while (!this.peekTokenIs(TokenItem.RBRACE)) {
            this.nextToken();
            const key = this.parseExpression(Operators.LOWEST);

            if (!this.expectPeek(TokenItem.COLON) || !key) {
                return undefined;
            }

            this.nextToken();
            const value = this.parseExpression(Operators.LOWEST);

            if (!value) {
                return undefined;
            }

            hash.pairs.set(key, value);

            if (
                !this.peekTokenIs(TokenItem.RBRACE) &&
                !this.expectPeek(TokenItem.COMMA)
            ) {
                return undefined;
            }
        }

        if (!this.expectPeek(TokenItem.RBRACE)) {
            return undefined;
        }

        return hash;
    };

    private parseIfExpression = (): IfExpression | undefined => {
        const exp = new IfExpression({ token: this.curToken });

        if (!this.expectPeek(TokenItem.LPAREN)) {
            return undefined;
        }

        this.nextToken();
        exp.condition = this.parseExpression(Operators.LOWEST);

        if (!this.expectPeek(TokenItem.RPAREN)) {
            return undefined;
        }

        if (!this.expectPeek(TokenItem.LBRACE)) {
            return undefined;
        }

        exp.consequence = this.parseBlockStatement();

        if (this.peekTokenIs(TokenItem.ELSE)) {
            this.nextToken();

            if (!this.expectPeek(TokenItem.LBRACE)) {
                return undefined;
            }

            exp.alternative = this.parseBlockStatement();
        }

        return exp;
    };

    private parseBlockStatement = (): BlockStatement => {
        const block = new BlockStatement({ token: this.curToken });
        block.statements = [];

        this.nextToken();

        while (
            !this.curTokenIs(TokenItem.RBRACE) &&
            !this.curTokenIs(TokenItem.EOF)
        ) {
            const stmt = this.parseStatement();

            if (stmt) {
                block.statements?.push(stmt);
            }
            this.nextToken();
        }

        return block;
    };

    private parseStringLiteral = (): StringLiteral => {
        return new StringLiteral({
            token: this.curToken,
            value: this.curToken.literal,
        });
    };

    private registerPrefix(tokenType: TokenType, fn: PrefixFn): void {
        this.prefixParseFns.set(tokenType, fn);
    }

    private registerInfix(tokenType: TokenType, fn: InfixFn): void {
        this.infixParseFns.set(tokenType, fn);
    }

    private peekPrecedence(): Operators {
        if (Object.hasOwn(precedences, this.peekToken.type)) {
            return precedences[this.peekToken.type as PrecedenceKey];
        }

        return Operators.LOWEST;
    }

    private curPrecedence(): Operators {
        if (Object.hasOwn(precedences, this.curToken.type)) {
            return precedences[this.curToken.type as PrecedenceKey];
        }

        return Operators.LOWEST;
    }

    private expectPeek(token: TokenType): boolean {
        if (this.peekTokenIs(token)) {
            this.nextToken();
            return true;
        }

        this.peekError(token);
        return false;
    }

    private curTokenIs(token: TokenType): boolean {
        return this.curToken.type === token;
    }

    private peekTokenIs(token: TokenType): boolean {
        return this.peekToken.type === token;
    }

    private noPrefixParseFnError(token: TokenType): void {
        const msg = `no prefix parse function for ${token} found`;
        this.errors.push(msg);
    }

    private peekError(token: TokenType): void {
        const msg = `expected next token to be ${token}, got ${this.peekToken.type} instead`;
        this.errors.push(msg);
    }
}
