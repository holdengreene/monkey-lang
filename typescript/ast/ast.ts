import { type Token } from "../token/token.js";

type ASTNode = {
    tokenLiteral(): string;
    string(): string;
};

type TokVal = {
    token?: Token;
    value?: Value;
};

type Value = string | number | boolean;

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
    value?: Value;
};
export class Expression implements ASTNode {
    public token?: Token;
    public value?: Value;

    constructor(expressionNode?: ExpressionNode) {
        this.token = expressionNode?.token;
        this.value = expressionNode?.value;
    }

    public tokenLiteral(): string {
        return this.token?.literal ?? "";
    }

    public string(): string {
        return `${this.value}` ?? "";
    }
}

type StatementNode = {
    token?: Token;
    value?: string | Expression;
};
export class Statement implements ASTNode {
    public token?: Token;
    public value?: string | Expression;

    constructor(statementNode: StatementNode) {
        this.token = statementNode.token;
        this.value = statementNode.value;
    }

    public tokenLiteral(): string {
        return this.token?.literal ?? "";
    }

    public string(): string {
        return `${this.value}`;
    }
}

type LetStatementNode = {
    token?: Token;
    name?: TokVal;
    value?: TokVal;
};
export class LetStatement extends Statement {
    public name?: Identifier;

    constructor(statementNode: LetStatementNode) {
        super({ token: statementNode.token });
        if (statementNode.name) {
            this.name = new Identifier(statementNode.name);
        }

        if (statementNode.value) {
            this.value = new Expression(statementNode.value);
        }
    }

    public string(): string {
        if (!this.name || !this.value) {
            return "";
        }

        const out: string[] = [];

        out.push(this.tokenLiteral() + " ");
        out.push(this.name.string());
        out.push(" = ");

        if (this.value && typeof this.value !== "string") {
            out.push(this.value.string());
        }

        out.push(";");

        return out.join("");
    }
}

type ReturnStatementNode = {
    token?: Token;
    returnValue?: Expression;
};
export class ReturnStatement extends Statement {
    public returnValue?: Expression;

    constructor(returnStatementNode: ReturnStatementNode) {
        super({ token: returnStatementNode.token });

        if (returnStatementNode.returnValue) {
            this.returnValue = returnStatementNode.returnValue;
        }
    }

    public string(): string {
        const out: string[] = [];

        out.push(this.tokenLiteral() + " ");
        if (this.returnValue) {
            out.push(this.returnValue.string());
        }
        out.push(";");

        return out.join("");
    }
}

type IdentifierExpressionNode = {
    token?: Token;
    value?: Value;
};
export class Identifier extends Expression {
    constructor(expressionNode: IdentifierExpressionNode) {
        super(expressionNode);
    }
}

type InfixExpressionNode = {
    token?: Token;
    left?: TokVal;
    operator?: string;
    right?: TokVal;
};

export class InfixExpression extends Expression {
    public left?: Expression;
    public operator?: string;
    public right?: Expression;

    constructor(infixExpressionNode: InfixExpressionNode) {
        super({ token: infixExpressionNode.token });

        this.left = new Expression(infixExpressionNode.left);
        this.operator = infixExpressionNode.operator;
        if (infixExpressionNode.right) {
            this.right = new Expression(infixExpressionNode.right);
        }
    }

    public string(): string {
        const out: string[] = [];

        out.push("(");
        if (this.left) {
            out.push(this.left.string());
        }
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
};
export class IntegerLiteral extends Expression {
    constructor(integerLiteralNode: IntegerLiteralNode) {
        super(integerLiteralNode);
    }
}

type StringLiteralNode = {
    token?: Token;
    value?: string;
};
export class StringLiteral extends Expression {
    constructor(stringLiteralNode: StringLiteralNode) {
        super(stringLiteralNode);
    }
}

type BooleanNode = {
    token?: Token;
    value?: boolean;
};
export class BooleanLiteral extends Expression {
    constructor(booleanNode: BooleanNode) {
        super(booleanNode);
    }
}
