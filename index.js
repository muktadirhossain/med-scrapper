import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import fs from 'fs';
import connectDB from "./config/connectDB.js";
import Medicine from './model/drug.model.js';

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
    $('.pagination .page-item a').each((index, element) => {
        const pageNumber = parseInt($(element).text(), 10);
        if (!isNaN(pageNumber) && pageNumber > totalPages) {
            totalPages = pageNumber;
        }
    });

    console.log(`📄 Total pages found: ${totalPages}`);

    // Loop through each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`📜 Scraping page ${pageNum}...`);
        const pageUrl = `${url}?page=${pageNum}`;
        
        // Load the page's content
        await page.goto(pageUrl);
        const pageContent = await page.content();
        const $ = cheerio.load(pageContent);

        // Array to store extracted data
        const data = [];

        // Extract information from each medicine block on the page
        $('.hoverable-block').each((index, element) => {
            const details_link = $(element).attr('href');
            const title = $(element).find('.col-xs-12.data-row-top').text().trim();
            const strength = $(element).find('.col-xs-12.data-row-strength').text().trim();
            const generic_name = $(element).find('.col-xs-12').eq(2).text().trim();
            const company = $(element).find('.data-row-company').text().trim();

            // Push the extracted data into the array
            data.push({
                details_link,
                brand_name: title,
                strength,
                generic_name,
                supplier: company,
                details: {} // Placeholder for additional details
            });
        });

        console.log(`🔍 Found ${data.length} medicines on page ${pageNum}.`);

        // Fetch details for each medicine and insert it into the database
        for (let i = 0; i < data.length; i++) {
            console.log(`🛠️ Scraping details of medicine ${i + 1}/${data.length} on page ${pageNum}...`);
            const detailsPageUrl = data[i].details_link;
            const detailsPageData = await scrapeDetailsPage(detailsPageUrl, browser);
            const medicineData = {
                ...data[i],
                ...detailsPageData // Merge the details into the data
            };

            // Insert the scraped medicine into the database
            try {
                const newMedicine = new Medicine(medicineData);
                await newMedicine.save();
                console.log(`✅ Successfully inserted ${medicineData.brand_name} into the database.`);
            } catch (err) {
                console.error(`❌ Error inserting ${medicineData.brand_name}:`, err);
            }

            // Add random delay between scraping each medicine detail
            await delay(2000, 5000); // Random delay between 2 to 5 seconds
        }

        // Add random delay between scraping each page
        await delay(3000, 7000); // Random delay between 3 to 7 seconds
    }

    // Close the browser after scraping
    await browser.close();
    console.log("🎉 Scraping completed and browser closed.");

    return;
}

// Scrape additional details from each medicine's page
async function scrapeDetailsPage(url, browser) {
    const page = await browser.newPage();

    // Navigate to the details page with increased timeout
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    console.log(`🔗 Navigating to details page: ${url}`);

    // Load the content of the details page into Cheerio
    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract required details such as unit price, package info, etc.
    const unitPrice = $('.package-container span').eq(1).text().trim();
    const packageSizeInfo = $('.package-container .pack-size-info').text().trim();
    const stripPrice = $('.package-container div span').eq(1).text().trim();

    // Extract the "Also available as" section, if present
    const alsoAvailableAs = [];
    $('.col-xs-12.margin-tb-10 .d-inline-block a').each((index, element) => {
        const href = $(element).attr('href');
        const title = $(element).attr('title');
        const text = $(element).text().trim();
        alsoAvailableAs.push({ href, title, text });
    });

    await page.close();
    console.log("📝 Details scraped successfully!");

    // Return the extracted details
    return {
        unitPrice,
        packageSizeInfo,
        stripPrice,
        alsoAvailableAs
    };
}

// Start scraping with the first page
scrapeWebsite('https://medex.com.bd/brands');
