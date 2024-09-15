import { createInterface, Interface } from "node:readline/promises";
import { Environment, newEnvironment } from "../object/environment.js";
import { Lexer } from "../lexer/Lexer.js";
import { Parser } from "../parser/parser.js";
import { evaluator } from "../evaluator/evaluator.js";

export async function start() {
    const env = newEnvironment();

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    await replEval(rl, env);
}

async function replEval(rl: Interface, env: Environment) {
    const line = await rl.question(">> ");

    const lexer = new Lexer(line);
    const parser = new Parser(lexer);
    const program = parser.parseProgram();

    if (parser.getErrors.length > 0) {
        return printParserErrors(parser.getErrors);
    }

    const evaluated = evaluator(program, env);
    if (evaluated) {
        console.log(evaluated.inspect());
    }

    return replEval(rl, env);
}

const monkeyface = `            
            __,__
   .--.  .-"     "-.  .--.
  / .. \/  .-. .-.  \/ .. \
 | |  '|  /   Y   \  |'  | |
 | \   \  \ 0 | 0 /  /   / |
  \ '- ,\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\ '-''
       |  \._   _./  |
       \   \ '~' /   /
        '._ '-=-' _.'
           '-----'
`;
function printParserErrors(errors: string[]) {
    console.log(monkeyface);
    console.log("Whoops! We ran into some monkey business here!");
    console.log("parser errors:");
    for (const error of errors) {
        console.log(error);
    }
}
