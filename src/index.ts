import readline from 'readline';
import * as BT from '@/wasm/binutils';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '$> ',
});

rl.prompt();

const question = (q: string, callback: (...args: string[]) => void) => {
  rl.question(q, (...args: string[]) => {
    try {
      callback(...args);
    } catch (e) {
      console.error(e.stack ?? e.message);
    }
  });
};

rl
  .on('line', (line) => {
    switch (line.trim()) {
      case 'd2b':
        question('num: ', (dig) => {
          console.log(BT.d2b(dig));
        });
        break;
      case 'd2h':
        question('num: ', (dig) => {
          console.log(BT.d2h(dig));
        });
        break;
      case 'b2d':
        question('bin: ', (bin) => {
          console.log(BT.b2d(bin));
        });
        break;
      case 'h2d':
        question('hex: ', (hex) => {
          console.log(BT.h2d(hex));
        });
        break;
      case 'b2h':
        question('hex: ', (hex) => {
          console.log(BT.d2h(BT.d2b(hex)));
        });
        break;
      case 'h2b':
        question('hex: ', (hex) => {
          console.log(BT.d2b(BT.h2d(hex)));
        });
        break;
      case 'd2o':
        question('dig: ', (dig) => {
          question('n: ', (n) => {
            console.log(BT.d2o(dig, Number(n)));
          });
        });
        break;
      case 'o2d':
        question('o2d: ', (bin) => {
          console.log(BT.o2d(bin));
        });
        break;
      case 'd2c':
        question('dig: ', (dig) => {
          question('n: ', (n) => {
            console.log(BT.d2c(dig, Number(n)));
          });
        });
        break;
      case 'c2d':
        question('c2d: ', (bin) => {
          console.log(BT.c2d(bin));
        });
        break;
      case 'c':
        readline.cursorTo(process.stdout, 0, 0);
        readline.clearScreenDown(process.stdout);
        break;
      case 'q':
        rl.close();
        break;
      default:
        break;
    }
    rl.prompt();
  })
  .on('close', () => {
    console.log('Bye~');
    process.exit(0);
  });
