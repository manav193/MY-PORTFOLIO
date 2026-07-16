const puppeteer = require('puppeteer');

const BASE_URL = process.env.PORTFOLIO_URL || 'http://localhost:4173/';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openPage(viewport = { width: 1440, height: 900 }) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('favicon.ico')) errors.push(message.text());
  });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  return { browser, page, errors };
}

async function openArcade(page) {
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForFunction(
    () => window.ArcadeOS?.state === 'HOME' && document.querySelector('#arcade-home.active'),
    { timeout: 12000 }
  );
}

async function openRoute(page, route) {
  await page.evaluate(value => window.ArcadeOS.openSystemRoute(value), route);
  await page.waitForFunction(
    value => window.ArcadeOS?.state === value && !document.querySelector('#arcade-loading.active'),
    { timeout: 12000 },
    route
  );
}

module.exports = { BASE_URL, assert, openPage, openArcade, openRoute };
