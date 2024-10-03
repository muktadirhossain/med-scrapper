import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import fs from 'fs';
import connectDB from "./config/connectDB.js";
import Medicine from './model/medicine.model.js'; 
import medicineData from './remaining7560Data.json' assert { type: "json" };

connectDB()

export async function scrapeWebsite(url) {
    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the URL with a disabled timeout and networkidle2 waiting strategy
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    // Get the HTML content of the page
    const content = await page.content();

    // Load the HTML content into Cheerio
    const $ = cheerio.load(content);

    const data = [...medicineData];

    // Loop through each medicine and scrape details
    for (let i = 0; i < data.length; i++) {
        console.log(`Getting details of ${i + 1}/${data.length}`);
        const detailsPageUrl = data[i].details_link;
        const detailsPageData = await scrapeDetailsPage(detailsPageUrl, browser);
        data[i].details = detailsPageData;

        // Insert the scraped medicine into the database
        try {
            const newMedicine = new Medicine(data[i]);
            await newMedicine.save();
            console.log(`Successfully inserted ${data[i].brand_name} into the database.`);
        } catch (err) {
            console.error(`Error inserting ${data[i].brand_name}:`, err);
        }
    }

    // Close the browser
    await browser.close();

    // Write the scraped data to a JSON file
    fs.writeFileSync('scrapedAllData.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log("Data written to JSON file.");

    return data;
}

// Scrape details from each medicine's page
async function scrapeDetailsPage(url, browser) {
    const page = await browser.newPage();

    // Navigate to the details page with increased timeout
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const content = await page.content();
    const $ = cheerio.load(content);

    // Extract the required information
    const unitPrice = $('.package-container span').eq(1).text().trim();
    const packageSizeInfo = $('.package-container .pack-size-info').text().trim();
    const stripPrice = $('.package-container div span').eq(1).text().trim();

    // Extract the "Also available as" section
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
}

scrapeWebsite('https://medex.com.bd/brands?page=1');
