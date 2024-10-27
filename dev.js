import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import fs from 'fs';
import connectDB from "./config/connectDB.js";
import Medicine from './model/drug.model.js';

// Connect to the database
connectDB();

// Maximum number of pages to scrape in parallel
const maxParallel = 15;
const progressFile = 'lastIndex.txt'; // File to track scraping progress

// Helper function to load the last processed index
function loadLastIndex() {
    if (fs.existsSync(progressFile)) {
        return parseInt(fs.readFileSync(progressFile, 'utf-8'), 10);
    }
    return 0;
}

// Helper function to save the current progress index
function saveLastIndex(index) {
    fs.writeFileSync(progressFile, index.toString(), 'utf-8');
}

export async function scrapeWebsite(url) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        headless: true
    });
    const page = await browser.newPage();

    // Block unnecessary requests for performance optimization
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
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

    // Start scraping from the last saved index
    let lastIndex = loadLastIndex();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`📜 Scraping page ${pageNum}...`);
        const pageUrl = `${url}?page=${pageNum}`;

        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 0 });
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

        // Fetch details for each medicine in parallel
        await scrapeInParallel(data, lastIndex, browser);
    }

    await browser.close();
    console.log("🎉 Scraping completed and browser closed.");
}

// Scraping details of each medicine in parallel
async function scrapeInParallel(data, lastIndex, browser) {
    let i = lastIndex;
    while (i < data.length) {
        const tasks = [];
        for (let j = 0; j < maxParallel && i < data.length; j++, i++) {
            tasks.push(scrapeDetailsPage(data[i].details_link, browser));
        }

        const details = await Promise.all(tasks);

        // Save each detail to the database
        details.forEach(async (detailsPageData, idx) => {
            const dataIndex = i - maxParallel + idx;

            // Merge the details with the main data
            const medicineData = {
                ...data[dataIndex],
                ...detailsPageData
            };

            try {
                const newMedicine = new Medicine(medicineData);
                await newMedicine.save();
                console.log(`✅ Successfully inserted ${medicineData.brand_name} into the database.`);
            } catch (err) {
                console.error(`❌ Error inserting ${medicineData.brand_name}:`, err);
            }

            // Save the progress after each insertion
            saveLastIndex(dataIndex);
        });
    }
}

// Scrape additional details from each medicine's page
async function scrapeDetailsPage(url, browser) {
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

        const content = await page.content();
        const $ = cheerio.load(content);

        const unitPrice = $('.package-container span').eq(1).text().trim();
        const packageSizeInfo = $('.package-container .pack-size-info').text().trim();
        const stripPrice = $('.package-container div span').eq(1).text().trim();

        const alsoAvailableAs = [];
        $('.col-xs-12.margin-tb-10 .d-inline-block a').each((index, element) => {
            const href = $(element).attr('href');
            const title = $(element).attr('title');
            const text = $(element).text().trim();
            alsoAvailableAs.push({ href, title, text });
        });

        await page.close();
        return {
            unitPrice,
            packageSizeInfo,
            stripPrice,
            alsoAvailableAs
        };
    } catch (error) {
        console.error(`Error scraping details page: ${url} -`, error);
        return {}; // Return empty object on error to avoid breaking the flow
    }
}

// Start scraping from the first page
scrapeWebsite('https://medex.com.bd/brands');
