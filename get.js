import fs from 'fs'
import medicineData from './remaining14352Data.json' assert { type: "json" };

const filteredData = medicineData.slice(7560);
console.log(filteredData.length)

fs.writeFileSync('remaining7560Data.json', JSON.stringify(filteredData, null, 2), 'utf-8');
console.log('Successfully saved remaining data to remainingData.json');



