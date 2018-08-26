const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.SchemaTypes.ObjectId;
const distributionInfoSchema = new Schema({
    chatId: ObjectId,
    distributionId: ObjectId,
    spreadsheetId: String,
    sheetiD: Number, 
    sheetTitle: String
});

const DistributionInfoModel = mongoose.model("distribution-info", distributionInfoSchema);

module.exports = {
    DistributionInfoModel,
    distributionInfoSchema
}