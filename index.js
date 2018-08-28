const {mongoose} = require("./db/mongoose");
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const {ChatModel} = require('./Models/Chat');
const { DistributionModel} = require("./Models/Distribution");
const {UserModel} = require("./Models/User");
const {CreateCommand} = require("./commands/create-command");
const {BeginCommand} = require("./commands/begin-command");
const {AnswerCommand} = require("./commands/answer-command");
const {SetNameCommand} = require("./commands/set-name");
const {StopCommand} = require("./commands/stop-command");
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly','https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
const Telegraf = require('telegraf')
//const Extra = require('telegraf/extra')
const session = require('telegraf/session')
const { reply } = Telegraf;
const config = require("./config.json");
let bot_id;
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const fetch = require('node-fetch')
const commandParts = require('telegraf-command-parts');
const {DistributionInfoModel} = require("./Models/DistrubutionInfo");


const bot = new Telegraf(config["bot-token"], {username:config.username});

const {PromiseQueue}= require("./utils/dynamic-promise-queue");
let queue = new PromiseQueue();
bot.telegram.getMe().then((res)=>{
    bot_id = res.id;
    console.log(res);
})
bot.use(commandParts());


let commands = {};
const {SpreadSheetSpecialTables} = require("./utils/spreadsheet-table");

const log = (ctx) => {
    console.log(ctx.message.text, ", sender:", ctx.from.last_name, ctx.from.first_name);
};

bot.on("left_chat_member", (ctx) => {
    console.log("Member left");
    const message = ctx.message;
    if (message.left_chat_participant.id === bot_id) {
        const chat = message.chat;
        ChatModel.remove({id: chat.id}).then((res) => {
            console.log("Chat", chat.title, "removed");
        }).catch(e => {
            console.log("Error while removing a chat", e);
        });
    }
    //console.log(JSON.stringify(ctx.update));
})


bot.command("answer", (ctx) => {
    log(ctx);
    if (ctx.message.chat.type === 'private')
        return;
    commands[ctx.from.id] = new AnswerCommand(ctx);
    const ans = commands[ctx.from.id];
    console.log(ctx.from);
    try {    
        queue.add(ans.onCommandCallback.bind(ans));
    } catch(e) {
        console.log(e);
    }
});

bot.command("setname", (ctx) => {
    log(ctx);
    if (ctx.message.chat.type !== 'private')
        return;
    let id = ctx.from.id;
    commands[id] = new SetNameCommand();
    commands[id].onCommandCallback(ctx);
    
})

bot.on("new_chat_members", (ctx) => {
    console.log("New member");
    const message = ctx.message;
    if (message.new_chat_participant.id === bot_id) {
        const chat = message.chat;
        let newChat = new ChatModel(chat);
        newChat.save().then((res) => {
            console.log("Chat", chat.title, "added");
        }).catch(e => {
            console.log("Error happend while saving the new chat", e);
        })
    }
    //console.log("New member");
    //console.log(JSON.stringify(ctx.update, undefined, 2));
    
})


bot.command('create', (ctx) => {
    log(ctx);

    let id = ctx.from.id.toString();
    if (ctx.message.chat.type !== 'private')
        return;
    commands[id] = new CreateCommand();
    commands[id].onCommandCallback(ctx);
})

bot.command("begin", (ctx) => {
    log(ctx);
    let id  = ctx.from.id;
    if (ctx.message.chat.type !== 'private')
        return;
    commands[id] = new BeginCommand();
    
    commands[id].onCommandCallback(ctx);
})

bot.command("stop", (ctx) => {
    log(ctx);
    let id  = ctx.from.id;

    if (ctx.message.chat.type !== 'private')
        return;
    commands[id] = new StopCommand();
    commands[id].onCommandCallback(ctx);
})

bot.on("text", (ctx) => {
    console.log(ctx.message.text, "sender:", ctx.from.last_name, ctx.from.first_name);
    let id  = ctx.from.id;
    let command = commands[id];
    if (command && command.ready && !command.isFinished()) {
        command.onTextCallback(ctx);
        if (command.isFinished()) {
            command = null;
        }
    }    
})


// bot.on("message", (ctx) => {
//     console.log("Message sent", JSON.stringify(ctx.update));
// } )
// Login widget events


// Start polling
bot.startPolling()
