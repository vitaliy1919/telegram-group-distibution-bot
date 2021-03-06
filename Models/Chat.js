const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    
    type: {
        type: String,
        required: true
    }
});

const ChatModel = mongoose.model("chat", chatSchema);
chatSchema.statics.getDistributionByChatId = function(chatId) {
    
}
module.exports = {
    chatSchema, ChatModel
}