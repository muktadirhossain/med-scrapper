import mongoose from 'mongoose';

const AlsoAvailableAsSchema = new mongoose.Schema({
    href: {
        type: String,
        // required: true
    },
    title: {
        type: String,
        // required: true
    },
    text: {
        type: String,
        // required: true
    }
}, { _id: false });


const MedicineSchema = new mongoose.Schema({
    details_link: {
        type: String,
        // required: true
    },
    brand_name: {
        type: String,
        // required: true
    },
    strength: {
        type: String,
        // required: true
    },
    generic_name: {
        type: String,
        // required: true
    },
    supplier: {
        type: String,
        // required: true
    },
    unitPrice: {
        type: String,
        // required: true
    },
    packageSizeInfo: {
        type: String,
        // required: true
    },
    stripPrice: {
        type: String
    },
    alsoAvailableAs: [AlsoAvailableAsSchema]
});

// Create the model
const Drug = mongoose.model('Drug', MedicineSchema);

export default Drug;
