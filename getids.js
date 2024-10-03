import medicineData from './medicines-name.json' with { type: "json" } ;
import fs from 'fs';

medicineData.forEach(item => {
    const match = item.details_link.match(/brands\/(\d+)/);
    if (match) {
      item.id = match[1];
    }
  });

  fs.writeFileSync('medicines-name-with-ids.json', JSON.stringify(medicineData, null, 2), 'utf-8');