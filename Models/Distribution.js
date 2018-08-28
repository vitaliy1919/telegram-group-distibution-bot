const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {ChatModel} = require("./Chat");
const {DistributionInfoModel} = require("./DistrubutionInfo");
let distributionSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
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

distributionSchema.statics.getDistributionByChatId = async function (chatId) {
    let chat = await ChatModel.findOne({id: chatId});
    if (!chat) {
        throw {info: `Чат не знайдено (можливо Ви зараз знаходитесь у приватному чаті з ботом)`};
    }
    let distributionInfo = await DistributionInfoModel.findOne({chatId: chat._id});
    if (!distributionInfo) {
        throw {info: `Зараз в цьому чаті не проводиться розподіл`};
    }

    let distribution = await DistributionModel.findById(distributionInfo.distributionId);
    return {distribution, distributionInfo};
}

let DistributionModel = mongoose.model("distribution", distributionSchema);
module.exports = {
    DistributionModel,
    distributionSchema
}

