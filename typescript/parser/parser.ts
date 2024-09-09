import {
    BooleanLiteral,
    Expression,
    ExpressionStatement,
    Identifier,
    InfixExpression,
    IntegerLiteral,
    LetStatement,
    PrefixExpression,
    Program,
    ReturnStatement,
    Statement,
} from "../ast/ast.js";
import type { Lexer } from "../lexer/Lexer.js";
import { tokenItem, TokenType, type Token } from "../token/token.js";

type PrefixFn = () => Expression;
type InfixFn = (arg: Expression) => Expression;

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
    [tokenItem.EQ]: Operators.EQUALS,
    [tokenItem.NOT_EQ]: Operators.EQUALS,
    [tokenItem.LT]: Operators.LESSGREATER,
    [tokenItem.GT]: Operators.LESSGREATER,
    [tokenItem.PLUS]: Operators.SUM,
    [tokenItem.MINUS]: Operators.SUM,
    [tokenItem.SLASH]: Operators.PRODUCT,
    [tokenItem.ASTERISK]: Operators.PRODUCT,
    [tokenItem.LPAREN]: Operators.CALL,
    [tokenItem.LBRACKET]: Operators.INDEX,
} as const;

type PrecedenceKey = keyof typeof precedences;

export class Parser {
    private errors: string[] = [];
    private curToken!: Token;
    private peekToken!: Token;
    private prefixParseFns = new Map<TokenType, PrefixFn>();
    private infixParseFns = new Map<TokenType, InfixFn>();

    constructor(private lexer: Lexer) {
        this.registerPrefix(tokenItem.IDENT, this.parseIdentifier);
        this.registerPrefix(tokenItem.INT, this.parseIntegerLiteral);
        this.registerPrefix(tokenItem.TRUE, this.parseBoolean);
        this.registerPrefix(tokenItem.FALSE, this.parseBoolean);
        this.registerPrefix(tokenItem.BANG, this.parsePrefixExpression);
        this.registerPrefix(tokenItem.MINUS, this.parsePrefixExpression);

        this.registerInfix(tokenItem.PLUS, this.parseInfixExpression);
        this.registerInfix(tokenItem.MINUS, this.parseInfixExpression);
        this.registerInfix(tokenItem.SLASH, this.parseInfixExpression);
        this.registerInfix(tokenItem.ASTERISK, this.parseInfixExpression);
        this.registerInfix(tokenItem.EQ, this.parseInfixExpression);
        this.registerInfix(tokenItem.NOT_EQ, this.parseInfixExpression);
        this.registerInfix(tokenItem.LT, this.parseInfixExpression);
        this.registerInfix(tokenItem.GT, this.parseInfixExpression);

        this.nextToken();
        this.nextToken();
    }

    public parseProgram(): Program {
        const program = new Program([]);

        while (!this.curTokenIs(tokenItem.EOF)) {
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
            case tokenItem.LET:
                return this.parseLetStatement();
            case tokenItem.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    }

    private parseLetStatement(): LetStatement | undefined {
        let stmt = new LetStatement({
            token: this.curToken,
        });

        if (!this.expectPeek(tokenItem.IDENT)) {
            return undefined;
        }

        stmt.name = new Identifier({
            token: this.curToken,
            value: this.curToken.literal,
        });

        if (!this.expectPeek(tokenItem.ASSIGN)) {
            return undefined;
        }

        this.nextToken();

        stmt.value = this.parseExpression(Operators.LOWEST);

        if (this.peekTokenIs(tokenItem.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    private parseReturnStatement(): ReturnStatement {
        let stmt = new ReturnStatement({ token: this.curToken });

        this.nextToken();

        stmt.returnValue = this.parseExpression(Operators.LOWEST);

        if (this.peekTokenIs(tokenItem.SEMICOLON)) {
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
            !this.peekTokenIs(tokenItem.SEMICOLON) &&
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

        if (this.peekTokenIs(tokenItem.SEMICOLON)) {
            this.nextToken();
        }

        return stmt;
    }

    private parsePrefixExpression = (): PrefixExpression => {
        let expression = new PrefixExpression({
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

        if (!value) {
            const msg = `could not parse ${this.curToken.literal} as integer`;
            this.errors.push(msg);
        }

        lit.value = value;
        return lit;
    };

    private parseBoolean = (): BooleanLiteral => {
        return new BooleanLiteral({
            token: this.curToken,
            value: this.curTokenIs(tokenItem.TRUE),
        });
    };

    private parseInfixExpression = (left: Expression): InfixExpression => {
        const exp = new InfixExpression({
            token: this.curToken,
            operator: this.curToken.literal,
            left,
        });

        const precedence = this.curPrecedence();
        this.nextToken();
        exp.right = this.parseExpression(precedence);

        return exp;
    }

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
