import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const puppeteer = require('C:\\Users\\santi\\AppData\\Local\\Temp\\puppeteer-test\\node_modules\\puppeteer');

const outDir = 'C:\\Users\\santi\\Desktop\\Website_Ich\\temporary screenshots';

const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:\\Users\\santi\\.cache\\puppeteer\\chrome\\win64-148.0.7778.167\\chrome-win64\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 15000 });

// Force all hero animations to their final state (headless Chrome may not run CSS animations)
await page.evaluate(() => {
  document.querySelectorAll(
    '.hero-eyebrow, .hero-text h1, .hero-sub, .hero-ctas, .hero-trust, .hero-terminal'
  ).forEach(el => {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
});

// Hero section full
await page.screenshot({ path: outDir + '\\hero-crop.png', clip: { x: 0, y: 0, width: 1440, height: 820 } });
// Terminal close-up
await page.screenshot({ path: outDir + '\\terminal-zoom.png', clip: { x: 700, y: 100, width: 680, height: 600 } });

await browser.close();
console.log('Clipped screenshots saved.');
