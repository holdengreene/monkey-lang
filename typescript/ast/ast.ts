import { type Token } from "../token/token.js";

type Node = {
    tokenLiteral(): string;
    string(): string;
};

export type Statement = Record<string, any>;

export class Program implements Node {
    constructor(private statements: Statement[]) {}

    public tokenLiteral(): string {
        if (this.statements.length > 0) {
            return this.statements[0].node.tokenLiteral();
        }

        return "";
    }

    public string(): string {
        const out: string[] = [];

        for (const statement of this.statements) {
            out.push(statement.string());
        }

        return out.join("");
    }
}

type LetStatementNode = {
    token: Token;
    name: { token: Token; value: string };
    value: { token: Token; value: string };
};
export class LetStatement implements Node {
    private token: Token;
    private name: Identifier;
    private value: Expression;

    constructor(statementNode: LetStatementNode) {
        this.token = statementNode.token;
        this.name = new Identifier(statementNode.name);
        this.value = new Expression(statementNode.value);
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        const out: string[] = [];

        out.push(this.tokenLiteral() + " ");
        out.push(this.name.string());
        out.push(" = ");

        if (this.value) {
            out.push(this.value.string());
        }

        out.push(";");

        return out.join("");
    }
}

type IdentifierExpressionNode = {
    token: Token;
    value: string;
};
export class Identifier implements Node {
    private token: Token;
    private value: string;

    constructor(expressionNode: IdentifierExpressionNode) {
        this.token = expressionNode.token;
        this.value = expressionNode.value;
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        return this.value;
    }
}

type ExpressionNode = {
    token: Token;
    value: string;
};
export class Expression implements Node {
    private token: Token;
    private value: string;

    constructor(expressionNode: ExpressionNode) {
        this.token = expressionNode.token;
        this.value = expressionNode.value;
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        return this.value;
    }
}
