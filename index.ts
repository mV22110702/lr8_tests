import Mocha from "mocha";

// @ts-ignore
import ts_mocha from "ts-mocha";

process.env.TS_NODE_PROJECT = './tsconfig.json';
const mocha = new Mocha();
mocha.addFile(`./tests/test1.spec.ts`);
mocha.run((failures) => {
    process.on('exit', () => {
        process.exit(failures); // exit with non-zero status if there were failures
    });
});
