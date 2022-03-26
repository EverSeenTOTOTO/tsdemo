import { launchBrowser } from './scripts/lib';

(async function main() {
  launchBrowser().then(async (b) => {
    const p = await b.newPage();
    await p.goto('http://www.example.com');
    b.close().finally(() => console.log('closed'));
  });
}());
