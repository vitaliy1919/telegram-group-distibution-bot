const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let distributionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    subjects: [{
        type: String,
        required: true,
    }],
    subjectsInfo: [
        [{
            type: String, 
            required: true
        }]
    ],
    maxPeopleInGroup: {
        type: Number,
        required: true
    }
});

let DistributionModel = mongoose.model("distribution", distributionSchema);
module.exports = {
    DistributionModel,
    distributionSchema
}