const {DistributionInfoModel} = require("./Models/DistrubutionInfo");
const {makeSequentialEnum} = require("./enum");
const Markup = require('telegraf/markup')
const { DistributionModel} = require("./Models/Distribution");
const {SpreadSheetSpecialTables} = require("./spreadsheet-table");
const {ChatModel} = require('./Models/Chat');
const {authorize} = require("./google-spreadsheets-auth");
const { google } = require('googleapis');

class BeginCommand {
    constructor() {
        this.stagesStrings = ["setDistribution", "setChat"];
        this.resultObj = {usedId: null};
        const stageEnum = makeSequentialEnum(...this.stagesStrings);
        this.stages = stageEnum.enumObj;
        this.currentStage = this.stages[this.stagesStrings[0]];
        this.next = stageEnum.next;
        this.distributions = null;
        this.distributions = null;
        this.chat = null;
        this.ctx = null;
        this.ready = false;
        this.okButton = Markup.
        keyboard(["Ok"])
        .resize()
        .extra();
    }

    setNextStage() {
        this.currentStage = this.next[this.currentStage];
    }
    
    setCtx(ctx) {
        this.ctx = ctx;
    }
    async getData(id) {
        try {
            let distributions = await DistributionModel.find({userId: id});
            if (distributions.length === 0) { 
                return { message: `Ви повинні спочатку створити розподіл`};
            }

            this.distributions = distributions;
            let chats = await ChatModel.find();
            if (chats.length === 0) { 
                return { message: `Бот повинен перебувати в чаті`};
            }
            this.chats = chats;
        } catch(e) {
            console.log("Error happened in /begin command:", e.message)
        }
    }
    onCommandCallback(ctx) {
        // ctx.reply(`Ви повинні спочатку створити розподіл`);
        this.resultObj.userId = ctx.from.id;
        this.ready = false;
        this.getData(ctx.from.id).then((obj) => {
            this.ready = true;
            if (obj) {
                return ctx.reply(obj.message);
            }
            let distributions = this.distributions.map((chat) => [chat.title]);
            ctx.reply(`Введіть назву розподілу`, Markup.
            keyboard(distributions)
            .resize()
            .extra());
        }).catch(e => console.log(e));
    }

    getResultObj() {
        return this.resultObj;
    }

    isFinished() {
        return !this.currentStage;
    }

    
    setDistribution(text) {
        if (this.resultObj.distributionId && text.toLowerCase() === "ok") {
            this.ctx.reply(`Оберіть чат, де хочете провести розподіл`, Markup.
            keyboard( this.chats.map((chat)=>[chat.title]) )
            .resize()
            .extra());
            this.setNextStage();
            return;
        }
        const distribution = this.distributions.find((dist) => dist.title === text);
        if (!distribution) {
            return this.ctx.reply(`Розподіл з назвою "${text}" не знайдено.\nСпробуйте ще раз`);
        }
        this.distribution = distribution;
        this.resultObj.distributionId = distribution._id;
        this.ctx.reply(`Ви обрали розподіл з назвою "${text}"\n(Введіть ще раз, якщо хочете змінити вибір)`, this.okButton);
    }

    setChat(text) {
        if (this.resultObj.chatId && text.toLowerCase() === "ok") {
            console.log(this.resultObj);
            let spreadsheet = new SpreadSheetSpecialTables(this.distribution);
            //this.ctx.reply('', Markup.removeKeyboard().extra());
            let distInfo = new DistributionInfoModel(this.resultObj);
            distInfo.save().then((res) => {
                console.log("Distribution info was successfully saved");
            }).catch(e => console.log("Error happened while saving distribution info", r.message));
            spreadsheet.createTablesInSpreadSheet().then((res) => {
                this.ctx.reply(`${res.data.spreadsheetUrl}`);
            }).catch(e => console.log("Error happened in setchat:", e))
            return this.ctx.reply(`Ви успішно запустили розподіл`, Markup.removeKeyboard().extra());
        }
        const chat = this.chats.find((chat) => chat.title === text);
        if (!chat) {
            return this.ctx.reply(`Чат з назвою "${text}" не знайдено.\nСпробуйте ще раз`);
        }
        this.chat = chat;
        this.resultObj.chatId = chat._id;
        this.ctx.reply(`Ви обрали чат з назвою "${text}"\n(Введіть ще раз, якщо хочете змінити вибір)`, this.okButton);
    }
    
    onTextCallback(ctx) {
        if (!this.currentStage || ctx.from.id !== this.resultObj.userId)
            return;
        const stages = this.stages;
        const stagesNames = this.stagesStrings;
        this.setCtx(ctx);
        const text = ctx.message.text;
        const functions = [
            this.setDistribution.bind(this),
            this.setChat.bind(this),
        ]
        for (let i = 0; i < stagesNames.length; i++)
            if (stages[stagesNames[i]] === this.currentStage) {
                functions[i](text);
                console.log(stagesNames[i]);
                break;
            }
    }
}

module.exports = {
    BeginCommand
}