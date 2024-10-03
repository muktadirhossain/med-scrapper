import puppeteer from "puppeteer";
import * as cheerio from 'cheerio';
import fs from 'fs';
import connectDB from "./config/connectDB.js";
import Medicine from './model/medicine.model.js';

connectDB()


export async function scrapeWebsite(url) {
    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the URL
    await page.goto(url);

    // Get the HTML content of the page
    const content = await page.content();

    // Load the HTML content into Cheerio
    const $ = cheerio.load(content);

    // Extract the total pages count
    let totalPages = 1; // Default to 1 if no pagination found
    $('.pagination .page-item a').each((index, element) => {
        const pageNumber = parseInt($(element).text(), 10);
        if (!isNaN(pageNumber) && pageNumber > totalPages) {
            totalPages = pageNumber;
        }
    });

    console.log('Total pages: ' + totalPages)


    const data = [];

    // Loop through each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {

        console.log("Scrapping page ...." + pageNum)
        const pageUrl = `${url}?page=${pageNum}`;
        await page.goto(pageUrl);
        const pageContent = await page.content();
        const $ = cheerio.load(pageContent);

        // Extract the information
        $('.hoverable-block').each((index, element) => {
            const details_link = $(element).attr('href');
            const title = $(element).find('.col-xs-12.data-row-top').text().trim();
            const strength = $(element).find('.col-xs-12.data-row-strength').text().trim();
            const generic_name = $(element).find('.col-xs-12').eq(2).text().trim();
            const company = $(element).find('.data-row-company').text().trim();

            data.push({
                details_link,
                brand_name: title,
                strength,
                generic_name,
                supplier: company,
                details: {} // Placeholder for additional details
            });
        });
    }

    // GET Details Info
    for (let i = 0; i < data.length; i++) {
        
        console.log(`getting details of ${data.length}/ ${i}`)
        const detailsPageUrl = data[i].details_link;
        const detailsPageData = await scrapeDetailsPage(detailsPageUrl, browser);
        data[i].details = detailsPageData;
        // Insert the scraped medicine into the database
        try {
            const newMedicine = new Medicine(data[i]);
            await newMedicine.save();  // Save the data to the database
            console.log(`Successfully inserted ${data[i].brand_name} into the database.`);
        } catch (err) {
            console.error(`Error inserting ${data[i].brand_name}:`, err);
        }
    }
    console.log(data);

    // Close the browser
    await browser.close();

    console.log("Writting json...")

    fs.writeFileSync('scrapedAllData.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log("Writting Done.")

    return data;
}


// GET Details of each medicine ::
async function scrapeDetailsPage(url, browser) {
    const page = await browser.newPage();
    await page.goto(url);
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

scrapeWebsite('https://medex.com.bd/brands?page=1')