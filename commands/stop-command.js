const {DistributionModel} = require("../Models/Distribution");
const {DistributionInfoModel} = require("../Models/DistrubutionInfo");
const {ChatModel} = require("../Models/Chat");
const Markup = require('telegraf/markup')
const {sendMessage} = require('./../utils/telegram-utils');

class StopCommand {

    constructor() {
        this.ctx = null;
        this.chats = null;
        this.distrInfos = null;
        this.chat = null;
        this.chatsFormated = null;
        this.ready = true;
        this.finished = false;
    }

    async getAllUsedChats() {
        const distrInfos = await DistributionInfoModel.find();
        this.distrInfos = distrInfos;
        const chatIdis = distrInfos.map((info) => info.chatId);
        const chats = await ChatModel.find({_id: {$in: chatIdis}});
        this.chats = chats;
        console.log(chats);
        const chatsFormated =  chats.map((chat) => [chat.title]);
        this.chatsFormated = chatsFormated;
        return chatsFormated;
    }

    isFinished() {
        return this.finished;
    }
    onCommandCallback(ctx) {
        this.getAllUsedChats().then((res) => {
            if (res.length <= 0) {
                return ctx.reply(`Ви ще не почали жодного розподілу. Зробіть це за допомогою /begin`)
            }
            ctx.reply("Оберіть чат, де Ви хочете зупинити розподіл", Markup
            .keyboard(res)
            .resize()
            .extra());
        }).catch(e => console.log(e));
    }

    onTextCallback(ctx) {
        const text = ctx.message.text;
        if (this.chat && text.toLowerCase() === "ok") {
            this.finished = true;
            let distInfo = this.distrInfos.find((info) => this.chat._id.toHexString() === info.chatId.toHexString());

            DistributionInfoModel.remove({_id: distInfo._id}).then(() => {
                ctx.reply(`Розподіл в чаті ${this.chat.title} зупинено`, Markup.removeKeyboard().extra());
                sendMessage(this.chat.id, ctx, "Розподіл завершено!");
            }).catch(console.log);
            return;
        }
        this.chat = this.chats.find((chat) => chat.title === text);
        if (!this.chat) {
            return ctx.reply(`У чаті "${text}" зараз не проводиться розподіл.\nСпробуйте ще раз."`, Markup
            .keyboard(this.chatsFormated)
            .resize()
            .extra());
        }
        ctx.reply(`Ви впевнені, що хочете зупинити розподіл в чаті "${text}"?\n Цю дію неможливо буде відмінити`, Markup
        .keyboard(["Ok"])
        .resize()
        .extra());
    }
}

module.exports = {
    StopCommand
}