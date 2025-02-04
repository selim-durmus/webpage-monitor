const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const nodemailer = require('nodemailer');
require('dotenv').config();

const { JSDOM } = jsdom;
const SITE_URL = process.env.SITE_URL;
const PRODUCT_SELECTOR = process.env.PRODUCT_SELECTOR;
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL, 10);

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const COLORS = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
};

let lastCheckedContents = {};

console.log(process.env.INITIAL_MSG);

async function checkPage() {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--disable-cache', '--disk-cache-size=0', '--no-sandbox', '--disable-background-networking'],
    });

    const page = await browser.newPage();
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });

    const pageContent = await page.content();
    await browser.close();  // Close browser after every check

    const dom = new JSDOM(pageContent);
    const elements = dom.window.document.querySelectorAll(PRODUCT_SELECTOR);

    for (const element of elements) {
      const availabilityStatus = element.textContent.trim();
      const productUrl = element.closest('a') ? element.closest('a').href : 'unknown product';

      console.log(`${COLORS.cyan}Product URL: ${productUrl}${COLORS.reset}`);
      console.log(availabilityStatus === "Not Available for Order"
        ? `${COLORS.red}Availability status: "${availabilityStatus}"${COLORS.reset}`
        : `${COLORS.green}Availability status: "${availabilityStatus}"${COLORS.reset}`
      );

      if (!lastCheckedContents[productUrl]) {
        lastCheckedContents[productUrl] = availabilityStatus;
        console.log(`${COLORS.yellow}No availability changes detected for this product. Monitoring continues...${COLORS.reset}\n`);
        continue;
      }

      if (availabilityStatus !== lastCheckedContents[productUrl]) {
        console.log(`${COLORS.magenta}Change detected for ${productUrl}: "${availabilityStatus}"${COLORS.reset}`);
        lastCheckedContents[productUrl] = availabilityStatus;
        await sendEmailNotification(productUrl, availabilityStatus);
      } else {
        console.log(`${COLORS.yellow}No availability changes detected for this product. Monitoring continues...${COLORS.reset}\n`);
      }
    }
  } catch (error) {
    console.error(`${COLORS.red}Error fetching or processing the page:${COLORS.reset} ${error.message}`);
  }
}

async function sendEmailNotification(productUrl, content) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      subject: "Availability Update Detected!",
      text: `Detected new availability for product: ${productUrl}\nStatus: "${content}"`,
    });
    console.log("Notification email sent!");
  } catch (error) {
    console.error("Error sending email:", error.message);
  }
}

// Run the check at the defined interval
setInterval(checkPage, CHECK_INTERVAL);
checkPage();
