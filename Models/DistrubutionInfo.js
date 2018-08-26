const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.SchemaTypes.ObjectId;
const distributionInfoSchema = new Schema({
    chatId: {
        type: ObjectId,
        required: true
    },
    distributionId: {
        type: ObjectId,
        required: true
    },
    spreadsheetId: {
        type: String, 
        required: true
    },
    spreadsheetUrl: {
        type: String, 
        required: true
    },
    sheetId: {
        type: Number,
        required: true
    },
    sheetTitle: {
        type: String,
        required: true
    }
});

const DistributionInfoModel = mongoose.model("distribution-info", distributionInfoSchema);

module.exports = {
    DistributionInfoModel,
    distributionInfoSchema
}