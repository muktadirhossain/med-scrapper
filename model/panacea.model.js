import mongoose from 'mongoose';


const MedicineSchema = new mongoose.Schema({
    details_link: {
        type: String,
    },
    brand_name: {
        type: String,
    },
    strength: {
        type: String,
    },
    generic_name: {
        type: String,
    },
    supplier: {
        type: String,
    },
    unitPrice: {
        type: String,
    },
    packageSizeInfo: {
        type: String,
    },
    stripPrice: {
        type: String
    },
    imageUrl: {
        type: String, // Added to store the image URL
    }
});

// Create the model
const Panacea = mongoose.model('Panacea', MedicineSchema);

export default Panacea;
