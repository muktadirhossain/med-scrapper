# Medicine Information Scraper

This project is a web scraper that extracts medicine information from the Medex website. It uses Puppeteer for browser automation and Cheerio for parsing HTML content. The scraped data is saved into a JSON file.

## Features

- Scrapes multiple pages of medicine listings.
- Extracts detailed information for each medicine, including:
  - Brand name
  - Generic name
  - Strength
  - Supplier
  - Unit price
  - Strip price
  - Package size info
  - Also available as (other forms of the medicine)
- Saves the scraped data into a JSON file.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/medicine-info-scraper.git
    cd medicine-info-scraper
    ```

2. Install the dependencies:
    ```bash
    npm install puppeteer cheerio
    ```

## Usage

1. Import the `scrapeWebsite` function and call it with the URL of the Medex website's medicine listings:
    ```javascript
    import { scrapeWebsite } from './path/to/your/scraper';

    scrapeWebsite('https://medex.com.bd/brands?page=1').then(data => {
        console.log('Scraping completed.');
    }).catch(err => {
        console.error('Error:', err);
    });
    ```

2. The scraped data will be saved to a file named `scrapedAllData.json` in the project directory.

## Code Overview

### scrapeWebsite Function

This function scrapes the main pages of the Medex website to gather basic information about each medicine. It also handles pagination to scrape data from all available pages.
