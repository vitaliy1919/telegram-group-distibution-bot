const {loadCredentials, authorize} = require("../utils/google-spreadsheets-auth");
const { google } = require('googleapis');
const {ChatModel} = require('../Models/Chat');
const {DistributionModel} = require("../Models/Distribution");
const {DistributionInfoModel} = require("../Models/DistrubutionInfo");
const {UserModel} = require("../Models/User");
const {sendMessage} = require('./../utils/telegram-utils');


const util = require('util');
class AnswerCommand {
    constructor(ctx) {
        this.ctx = ctx;
        this.from = ctx.from;
        //this.distribution = null;
    }

    async returnTextToSend() {
        let user = await UserModel.findOne({userId: this.from.id});
        if (user)
            return user.userName;
        if (!this.from.last_name) {
            let name = this.from.first_name;
            if (this.from.username)
                name += ' ' + this.from.username;
            return name;
        }
        return this.from.last_name + ' ' + this.from.first_name;
    }
    // async getDistributionByChatId(chatId) {
    //     let chat = await ChatModel.findOne({id: chatId});
    //     if (!chat) {
    //         throw {info: `Чат не знайдено (можливо Ви зараз знаходитесь у приватному чаті з ботом)`};
    //     }
    //     let distributionInfo = await DistributionInfoModel.findOne({chatId: chat._id});
    //     if (!distributionInfo) {
    //         throw {info: `Зараз в цьому чаті не проводиться розподіл`};
    //     }

    //     let distribution = await DistributionModel.findById(distributionInfo.distributionId);
    //     return {distribution, distributionInfo};
    // }

    async getValues(distribution, distributionInfo, columnStart, subjectIndex) {
        await loadCredentials();
        let auth = await authorize();
        let columnEnd = columnStart +  distribution.subjectsInfo[subjectIndex].length - 1;
        let letterStart = String.fromCharCode("A".charCodeAt(0) + columnStart);
        let letterEnd = String.fromCharCode("A".charCodeAt(0) + columnEnd);
        let sheets = google.sheets({ version: 'v4', auth })
        let get = util.promisify(sheets.spreadsheets.values.get);
        let cellVals = await get({
            spreadsheetId: distributionInfo.spreadsheetId,
            range: `${distributionInfo.sheetTitle}!${letterStart}4:${letterEnd}${4 + distribution.maxPeopleInGroup}`,
            majorDimension: "COLUMNS"
        });
        let cellData = cellVals.data.values;
        if (!cellData)
            cellData = [];
        for (let i = 0; i < distribution.subjects.length; i++) 
            if (!cellData[i])
                cellData[i] = [];
        return cellData;    
    }

    async updateValue(distributionInfo, column, length, text) {
        await loadCredentials();
        let auth = await authorize();
        let sheets = google.sheets({ version: 'v4', auth })
        let update = util.promisify(sheets.spreadsheets.values.update);
        let batchUpdate = util.promisify(sheets.spreadsheets.batchUpdate);
        let letter = String.fromCharCode("A".charCodeAt(0) + column);

        let cellVals = await update({
            spreadsheetId: distributionInfo.spreadsheetId,
            range: `${distributionInfo.sheetTitle}!${letter}${4 + length}:${letter}${4 + length}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                "majorDimension": "COLUMNS",
                values: [[text]]
            }
        });
        let bupdate = await batchUpdate({
            spreadsheetId: distributionInfo.spreadsheetId,
            resource: {
                requests: [{
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId: distributionInfo.sheetId,
                            dimension: "COLUMNS",
                            startIndex: column,
                            endIndex: 1 + column
                        }
                    }
                }]
            }
        })
       // console.log(cellVals);
        //console.log(bupdate);
    }

    async onCommandCallback() {
        try {
            let choice = [];
            let text = await this.returnTextToSend();
            let {distribution, distributionInfo} = await DistributionModel.getDistributionByChatId(this.ctx.chat.id)
            let args = this.ctx.state.command.splitArgs;
            for (let i = 0; i < args.length; ++i) {
                let a = Number(args[i]);
                if (isNaN(a)) {
                    return sendMessage(this.ctx.from.id, this.ctx, `${i+1} аргумент /answer не є числом`);
                }
            }
            if (args.length !== distribution.subjects.length) {
                return sendMessage(this.ctx.from.id, this.ctx, `Ви повинні ввести ${distribution.subjects.length} аргументів для команди /answer`);
            }
            let columnStart = 1;
            let maxPeopleInGroup = distribution.maxPeopleInGroup;
            let userId = this.from.id;
            for (let index = 0; index < args.length; ++index) {
                let value = args[index] - 1;
                let data = await this.getValues(distribution, distributionInfo, columnStart, index);
                const thisUserNotVoted = data.every((range) => {
                    return !range.includes(text);
                });
                if (!thisUserNotVoted) {
                    return sendMessage(userId, this.ctx, `Ви вже голосували`);
                }
                if (value >= distribution.subjectsInfo[index].length)
                    return sendMessage(userId, this.ctx, `${index + 1} аргумент /answer неправильний`);
                
                if (data[value].length >= maxPeopleInGroup) {
                    if (value !== distribution.subjects.length - 1) {
                        value++;
                    //await this.updateValue(distributionInfo, columnStart + 1, data[value].length, text);
                    } else if (value !== 0) {
                        value--;
                    }
                }
                const column = columnStart + value;
                await this.updateValue(distributionInfo, column, data[value].length, text);
                choice.push(value);
                columnStart += distribution.subjectsInfo[index].length + 2;
            }
            let choiceString = `Ваш розподіл:\n`;
            distribution.subjects.forEach((subject, index) => {
                let infoChosen = distribution.subjectsInfo[index][choice[index]];
                choiceString += "<strong>" + subject + "</strong>: ";
                choiceString += infoChosen + "\n";
            });
            choiceString += `Детальніша інформація за посиланням: ${distributionInfo.spreadsheetUrl}`
            sendMessage(userId, this.ctx, choiceString, {parse_mode: "HTML"});
        } catch (e) {
            if (e.info) {
                this.ctx.reply(`${e.info}`)
            } else {
                console.log(e);
            }
        }
    }
}

module.exports = {
    AnswerCommand
}