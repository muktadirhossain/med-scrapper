import mongoose from 'mongoose';

const AlsoAvailableAsSchema = new mongoose.Schema({
    href: {
        type: String,
    },
    title: {
        type: String,
    },
    text: {
        type: String,
    }
}, { _id: false });


const MedicineSchema = new mongoose.Schema({
    details_link: {
        type: String,
        unique: true,
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
    alsoAvailableAs: [AlsoAvailableAsSchema]
});

// Create the model
const Drug = mongoose.model('Drug', MedicineSchema);

export default Drug;
