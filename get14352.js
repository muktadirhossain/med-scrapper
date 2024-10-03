import fs from 'fs'
import medicineData from './medicines-name.json' assert { type: "json" };

const filteredData = medicineData.slice(9468);
console.log(filteredData.length)

fs.writeFileSync('remaining14352Data.json', JSON.stringify(filteredData, null, 2), 'utf-8');
console.log('Successfully saved remaining data to remainingData.json');



