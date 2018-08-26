const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    }
});

const UserModel = mongoose.model("user", userSchema);

module.exports = {
    userSchema,
    UserModel
}