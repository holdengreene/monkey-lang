import { type Token } from "../token/token.js";

type ASTNode = {
    tokenLiteral(): string;
    string(): string;
};

type TokVal = {
    token: Token;
    value: string;
};

export type ProgramStatement = Record<string, any>;
export class Program implements ASTNode {
    constructor(public statements: ProgramStatement[]) {}

    public tokenLiteral(): string {
        if (this.statements.length > 0) {
            return this.statements[0].tokenLiteral();
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

type ExpressionNode = {
    token?: Token;
    value?: string | number | boolean;
};
export class Expression implements ASTNode {
    public token?: Token;
    public value?: string | number | boolean;

    constructor(expressionNode: ExpressionNode) {
        this.token = expressionNode.token;
        this.value = expressionNode.value;
    }

    public tokenLiteral(): string {
        return this.token?.literal ?? "";
    }

    public string(): string {
        return `${this.value}` ?? "";
    }
}

type StatementNode = {
    token: Token;
    value: string;
};
export class Statement implements ASTNode {
    public token: Token;
    public value: string;

    constructor(statementNode: StatementNode) {
        this.token = statementNode.token;
        this.value = statementNode.value;
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        return this.value;
    }
}

type LetStatementNode = {
    token: Token;
    name?: TokVal;
    value?: TokVal;
};
export class LetStatement implements ASTNode {
    public name?: Identifier;
    public value?: Expression;
    public token: Token;

    constructor(statementNode: LetStatementNode) {
        this.token = statementNode.token;
        if (statementNode.name) {
            this.name = new Identifier(statementNode.name);
        }

        if (statementNode.value) {
            this.value = new Expression(statementNode.value);
        }
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        if (!this.name || !this.value) {
            return "";
        }

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
export class Identifier implements ASTNode {
    public token: Token;
    public value: string;

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

type InfixExpressionNode = {
    token: Token;
    left: TokVal;
    operator: string;
    right?: TokVal;
};

export class InfixExpression implements ASTNode {
    public token: Token;
    public left: Expression;
    public operator: string;
    public right?: Expression;

    constructor(infixExpressionNode: InfixExpressionNode) {
        this.token = infixExpressionNode.token;
        this.left = new Expression(infixExpressionNode.left);
        this.operator = infixExpressionNode.operator;
        if (infixExpressionNode.right) {
            this.right = new Expression(infixExpressionNode.right);
        }
    }

    public tokenLiteral(): string {
        return this.token.literal;
    }

    public string(): string {
        const out: string[] = [];

        out.push("(");
        out.push(this.left.string());
        out.push(` ${this.operator} `);
        if (this.right) {
            out.push(this.right.string());
        }
        out.push(")");

        return out.join("");
    }
}

type IntegerLiteralNode = {
    token?: Token;
    value?: number;
}
export class IntegerLiteral extends Expression {
    constructor(integerLiteralNode: IntegerLiteralNode) {
        super(integerLiteralNode);
    }
}


type StringLiteralNode = {
    token: Token;
    value: string;
};
export class StringLiteral extends Expression {
    constructor(stringLiteralNode: StringLiteralNode) {
        super(stringLiteralNode);
    }
}

type BooleanNode = {
    token?: Token;
    value: boolean;
}
export class BooleanLiteral extends Expression {
    constructor(booleanNode: BooleanNode) {
        super(booleanNode);
    }
}
