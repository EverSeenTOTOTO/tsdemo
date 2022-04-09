import path from 'path';
import fs from 'fs';
import puppeteer from 'puppeteer-core';

export const randomTimespan = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const connectBrowser = (options?: puppeteer.ConnectOptions) => {
  return puppeteer.connect({
    ignoreHTTPSErrors: true,
    slowMo: randomTimespan(300, 1000),
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    ...options,
  });
};

export const launchBrowser = (options?: Parameters<typeof puppeteer.launch>) => {
  return puppeteer.launch({
    executablePath: 'google-chrome',
    ignoreHTTPSErrors: true,
    slowMo: 1000,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--disable-web-security',
      '--proxy-server=socks5://localhost:7891',
      '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
    ],
    ...options,
  });
};

export const createDataDirectory = (dirpath: string) => {
  const dir = path.join(__dirname, dirpath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.info(`${dir} directory created.`);
  }

  return dir;
};

export const scrollDown = (page: puppeteer.Page) => {
  console.info('Scrolling down...');

  return page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
};

export const scrollIntoView = (page: puppeteer.Page, selector: string) => {
  console.info(`Scrolling into view: ${selector}`);

  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, selector);
};

export const click = async (page: puppeteer.Page, selector: string) => {
  console.info(`Clicking element: ${selector}`);

  return page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLElement;
    const originBorder = element.style.border;

    element.style.border = '1px solid red';
    element.click();
    setTimeout(() => {
      element.style.border = originBorder;
    }, 1000);
  }, selector);
};
