import { type Token } from "../token/token.js";

export type ASTNode = {
    tokenLiteral(): string;
    string(): string;
};

type Value = string | number | boolean;

export class Program implements ASTNode {
    constructor(public statements: Statement[]) {}

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
export abstract class Expression implements ASTNode {
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
export abstract class Statement implements ASTNode {
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
    name?: Identifier;
    value?: Expression;
};
export class LetStatement extends Statement {
    public name?: Identifier;
    public value?: Expression;

    constructor(statementNode: LetStatementNode) {
        super({ token: statementNode.token });
        this.name = statementNode.name;
        this.value = statementNode.value;
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

        this.returnValue = returnStatementNode.returnValue;
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

type ExpressionStatementNode = {
    token?: Token;
    expression?: Expression;
};
export class ExpressionStatement extends Statement {
    public expression?: Expression;

    constructor(expressionStatementNode: ExpressionStatementNode) {
        super({ token: expressionStatementNode.token });

        this.expression = expressionStatementNode.expression;
    }

    public string(): string {
        if (this.expression) {
            return this.expression.string();
        }

        return "";
    }
}

type IdentifierExpressionNode = {
    token?: Token;
    value?: string;
};
export class Identifier extends Expression {
    public value?: string;

    constructor(expressionNode: IdentifierExpressionNode) {
        super({ token: expressionNode.token });
        this.value = expressionNode.value;
    }
}

type PrefixExpressionNode = {
    token?: Token;
    operator?: string;
    right?: Expression;
};
export class PrefixExpression extends Expression {
    public operator?: string;
    public right?: Expression;

    constructor(prefixExpressionNode: PrefixExpressionNode) {
        super({ token: prefixExpressionNode.token });

        this.operator = prefixExpressionNode.operator;
        this.right = prefixExpressionNode.right;
    }

    public string(): string {
        const out: string[] = [];
        out.push("(");
        out.push(this.operator ?? "");
        out.push(this.right?.string() ?? "");
        out.push(")");
        return out.join("");
    }
}

type InfixExpressionNode = {
    token?: Token;
    left?: Expression;
    operator?: string;
    right?: Expression;
};
export class InfixExpression extends Expression {
    public left?: Expression;
    public operator?: string;
    public right?: Expression;

    constructor(infixExpressionNode: InfixExpressionNode) {
        super({ token: infixExpressionNode.token });

        this.left = infixExpressionNode.left;
        this.operator = infixExpressionNode.operator;
        this.right = infixExpressionNode.right;
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

type IfExpressionNode = {
    token?: Token;
    condition?: Expression;
    consequence?: BlockStatement;
    alternative?: BlockStatement;
};
export class IfExpression extends Expression {
    public condition?: Expression;
    public consequence?: BlockStatement;
    public alternative?: BlockStatement;

    constructor(ifExpressionNode: IfExpressionNode) {
        super({ token: ifExpressionNode.token });

        this.condition = ifExpressionNode.condition;
        this.consequence = ifExpressionNode.consequence;
        this.alternative = ifExpressionNode.alternative;
    }

    public string(): string {
        const out: string[] = [];
        out.push("if");
        out.push(this.condition?.string() ?? "");
        out.push(" ");
        out.push(this.consequence?.string() ?? "");

        if (this.alternative) {
            out.push("else ");
            out.push(this.alternative.string());
        }

        return out.join("");
    }
}

type ForStatementNode = {
    token?: Token;
    initialization?: Identifier;
    condition?: Expression;
    afterthought?: Expression;
    body?: BlockStatement;
};
export class ForLiteral extends Expression {
    public initialization?: Expression;
    public condition?: Expression;
    public afterthought?: Expression;
    public body?: BlockStatement;

    constructor(forStatementNode: ForStatementNode) {
        super({ token: forStatementNode.token });
        this.initialization = forStatementNode.initialization;
        this.condition = forStatementNode.condition;
        this.afterthought = forStatementNode.afterthought;
        this.body = forStatementNode.body;
    }
}

type BlockStatementNode = {
    token?: Token;
    statements?: Statement[];
};
export class BlockStatement extends Statement {
    public statements?: Statement[];

    constructor(blockStatementNode: BlockStatementNode) {
        super({ token: blockStatementNode.token });

        this.statements = blockStatementNode.statements;
    }

    public string(): string {
        const out: string[] = [];

        for (const stmt of this.statements ?? []) {
            out.push(stmt.string());
        }

        return out.join("");
    }
}

type FunctionLiteralNode = {
    token?: Token;
    parameters?: Identifier[];
    body?: BlockStatement;
};
export class FunctionLiteral extends Expression {
    public parameters?: Identifier[];
    public body?: BlockStatement;

    constructor(functionLiteralNode: FunctionLiteralNode) {
        super({ token: functionLiteralNode.token });

        this.parameters = functionLiteralNode.parameters;
        this.body = functionLiteralNode.body;
    }

    public string(): string {
        const out: string[] = [];
        const params: string[] = [];

        for (const param of this.parameters ?? []) {
            out.push(param.string());
        }

        out.push(this.tokenLiteral());
        out.push("(");
        out.push(params.join(", "));
        out.push(") ");
        out.push(this.body?.string() ?? "");
        return out.join("");
    }
}

type CallExpressionNode = {
    token?: Token;
    function?: Expression;
    arguments?: Expression[];
};
export class CallExpression extends Expression {
    public function?: Expression;
    public arguments?: Expression[];

    constructor(callExpressionNode: CallExpressionNode) {
        super({ token: callExpressionNode.token });

        this.function = callExpressionNode.function;
        this.arguments = callExpressionNode.arguments;
    }

    public string(): string {
        const out: string[] = [];
        const args: string[] = [];

        for (const arg of this.arguments ?? []) {
            args.push(arg.string());
        }

        out.push(this.function?.string() ?? "");
        out.push("(");
        out.push(args.join(", "));
        out.push(")");

        return out.join("");
    }
}

type HashLiteralNode = {
    token?: Token;
    pairs?: Map<Expression, Expression>;
};
export class HashLiteral extends Expression {
    public pairs?: Map<Expression, Expression>;

    constructor(hashLiteralNode: HashLiteralNode) {
        super({ token: hashLiteralNode.token });
        this.pairs = hashLiteralNode.pairs;
    }

    public string(): string {
        const out: string[] = [];
        const pairs: string[] = [];

        for (const [key, value] of this.pairs ?? []) {
            pairs.push(key.string() + ":" + value.string());
        }

        out.push("{");
        out.push(pairs.join(", "));
        out.push("}");
        return out.join("");
    }
}

type ArrayLiteralNode = {
    token?: Token;
    elements?: Expression[];
};
export class ArrayLiteral extends Expression {
    public elements?: Expression[];

    constructor(arrayLiteralNode: ArrayLiteralNode) {
        super({ token: arrayLiteralNode.token });
        this.elements = arrayLiteralNode.elements;
    }

    public string(): string {
        const out: string[] = [];
        const elements: string[] = [];

        for (const element of this.elements ?? []) {
            elements.push(element.string());
        }

        out.push("[");
        out.push(elements.join(", "));
        out.push("]");
        return out.join("");
    }
}

type IndexExpressionNode = {
    token?: Token;
    left?: Expression;
    index?: Expression;
};
export class IndexExpression extends Expression {
    public left?: Expression;
    public index?: Expression;

    constructor(indexExpressionNode: IndexExpressionNode) {
        super({ token: indexExpressionNode.token });
        this.left = indexExpressionNode.left;
        this.index = indexExpressionNode.index;
    }

    public string(): string {
        const out: string[] = [];
        out.push("(");
        out.push(this.left?.string() ?? "");
        out.push("[");
        out.push(this.index?.string() ?? "");
        out.push("])");
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
    public value?: string;

    constructor(stringLiteralNode: StringLiteralNode) {
        super({ token: stringLiteralNode.token });
        this.value = stringLiteralNode.value;
    }
}

type BooleanLiteralNode = {
    token?: Token;
    value?: boolean;
};
export class BooleanLiteral extends Expression {
    public value?: boolean;

    constructor(booleanNode: BooleanLiteralNode) {
        super({ token: booleanNode.token });
        this.value = booleanNode.value;
    }
}
