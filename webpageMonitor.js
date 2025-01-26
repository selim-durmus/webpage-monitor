// Import necessary modules
const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Setting up email transporter using environment variables
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Function to send an email notification
async function sendEmailNotification(subject, text) {
  const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_TO,
    subject: subject,
    text: text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Function to monitor page changes
async function monitorPageChanges(page) {
  let previousContent = '';
  let firstCheckDone = false;

  // Initial page check
  console.log(process.env.INITIAL_MSG);

  setInterval(async () => {
    // Wait for the product container to load (with a timeout for safety)
    await page.waitForSelector(process.env.PRODUCT_SELECTOR, { timeout: 15000 });

    // Extract and clean up the current content from the product container
    const currentContent = await page.$eval(process.env.PRODUCT_SELECTOR, (el) => el.innerText.trim().replace(/\s+/g, ' '));

    // Output the text that's been checked
    console.log(`Checked content: "${currentContent}"`);

    // Skip email notifications on the first check to prevent false positives
    if (!firstCheckDone) {
      firstCheckDone = true;
      previousContent = currentContent;
      console.log("First check complete. Monitoring for further changes.");
      return;  // Skip sending email on the first check
    }

    // Only send a notification if the content is significantly different
    if (currentContent !== previousContent) {
      console.log(process.env.CHANGE_DETECTED_MSG);

      // Check if the availability check message exists in the content
      if (currentContent.includes(process.env.AVAILABILITY_CHECK_TEXT)) {
        console.log(`Product status: "${currentContent}"`);
        await sendEmailNotification('Product availability change detected', `Product status changed to: "${currentContent}"`);
      } else {
        console.log(process.env.NO_CHANGE_MSG);
      }

      // Update the previous content for future checks
      previousContent = currentContent;
    } else {
      console.log('No content change detected.');
    }
  }, process.env.CHECK_INTERVAL);
}

// Open browser, navigate to the page, and start monitoring
async function testProductAvailability() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(process.env.SITE_URL);

  // Start monitoring the page for changes
  await monitorPageChanges(page);
}

testProductAvailability();
