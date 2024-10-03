import fs from 'fs';
import connectDB from "./config/connectDB.js";
import Medicine from './model/medicine.model.js';


connectDB();

const runQuery = async () => {
    try {
        const allMedicines = await Medicine.find().select("-__v").lean();

        const transformedData = allMedicines.map(item => {
            
            const match = item.details_link.match(/brands\/(\d+)/);
            if (match) {
              item.med_ex_id = match[1];
            }
            const { details, ...rest } = item;  // Destructure 'details' and the rest of the item
            
            return {
                ...rest,  // Spread the rest of the properties (excluding 'details')
                ...details // Spread the properties inside 'details'
            };
        });
        console.log(transformedData)

        fs.writeFileSync('data/final.json', JSON.stringify(transformedData, null, 2), 'utf-8');

    } catch (error) {
        throw new Error(error.message);
    }
}

runQuery();
