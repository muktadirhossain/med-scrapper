import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import connectDB from "./config/connectDB.js";
import PanaceaOtc from "./model/panacea-otc.model.js";

// Connect to the database
connectDB();

// Helper function to add a random delay
const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

export async function scrapeWebsite(url) {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
    });
    const page = await browser.newPage();

    // Go to the initial URL with a disabled timeout and wait for the network to be idle
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    console.log("🚀 Browser launched and page loaded!");

    // Get the HTML content of the page and load it into Cheerio
    const content = await page.content();
    const $ = cheerio.load(content);

    // Determine total pages (pagination) if available
    let totalPages = 1; // Default to 1 if no pagination found

    // Find the element with the text that contains the total page number
    const totalPagesText = $('.pagination-total-text p').text();
    // Use a regular expression to capture the number of pages
    const match = totalPagesText.match(/(\d+)\s*Pages/);
    totalPages = match ? parseInt(match[1], 10) : 1; // Default to 1 if no match

    console.log(`📄 Total pages found: ${totalPages}`);

    // Loop through each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`📜 Scraping page ${pageNum}...`);
        const pageUrl = `${url}?page=${pageNum}`;


        // Load the page's content
        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 0 });
        const pageContent = await page.content();
        const $ = cheerio.load(pageContent);

        const products = [];

        $('.grid > a').each((index, element) => {
            const productLink = $(element).attr('href');
            const title = $(element).find('article').attr('title');
            const price = $(element).find('.text-13px.sm\\:text-lg.lg\\:text-lg.font-semibold.text-brand-dark').text().trim();
            const genericName = $(element).find('.text-brand-accentColor1.text-13px.sm\\:text-sm.lg\\:text-sm.mb-1').text().trim(); // Generic name            const manufacturer = $(element).find('.text-brand-gray').last().text().trim();
            const dosage = $(element).find('.product-generic-size').text().trim();
            const manufacturer = $(element).find('.text-brand-gray').last().text().trim();

            const imageUrl = $(element).find('article img.object-cover.bg-fill-thumbnail').attr('src');

            products.push({
                title: `${title} - ${dosage}`,
                price,
                manufacturer,
                dosage,
                genericName,
                productLink: `https://medeasy.health${productLink}`,
                imageUrl: `https://medeasy.health/${imageUrl}`
            });
        });

        console.log(products);

        // Insert scraped data into the database
        for (const product of products) {
            try {
                await PanaceaOtc.create({
                    brand_name: product.title,
                    strength: product.dosage,
                    generic_name: product.genericName,
                    supplier: product.manufacturer,
                    unitPrice: product.price,
                    details_link: product.productLink,
                    imageUrl: product.imageUrl
                });
                console.log(`✅ Inserted: ${product.title}`);
            } catch (error) {
                console.error(`❌ Error inserting ${product.title}: ${error.message}`);
            }
        }


        // console.log(`🔍 Found ${data.length} medicines on page ${pageNum}.`);

    }

    // Close the browser after scraping
    await browser.close();
    console.log("🎉🎉🎉 Scraping completed and browser closed.");

    return;
}



// Start scraping with the first page
// scrapeWebsite('https://medeasy.health/category/prescription-medicine');
scrapeWebsite('https://medeasy.health/category/otc-medicine');
