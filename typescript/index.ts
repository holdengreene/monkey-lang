import { Lexer } from "./lexer/Lexer.js";

const input = 'let five = "five";';

const lexer = new Lexer(input);

let i = 0;
while (i <= 4) {
    const token = lexer.nextToken();

    console.log(token);
    i++;
}

