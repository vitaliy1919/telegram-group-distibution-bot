const {mongoose} = require("./db/mongoose");
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const {ChatModel} = require('./Models/Chat');
const { DistributionModel} = require("./Models/Distribution");

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
const bot = new Telegraf(config["bot-token"], {username:config.username});
const commandParts = require('telegraf-command-parts');
const {PromiseQueue}= require("./dynamic-promise-queue");
let queue = new PromiseQueue();
bot.telegram.getMe().then((res)=>{
    bot_id = res.id;
    console.log(res);
})
bot.use(commandParts());

const {CreateCommand} = require("./create-command");
const {BeginCommand} = require("./begin-command");
const {AnswerCommand} = require("./answer-command");
let createCommand = null;
let beginCommand = null;
const {SpreadSheetSpecialTables} = require("./spreadsheet-table");

// let obj = { 
//     "subjects" : [
//         "Предмет 1", 
//         "Предмет 2"
//     ], 
//     "subjectsInfo" : [
//         [
//             "Іванов", 
//             "Петров"
//         ], 
//         [
//             "Сидоров", 
//             "Котельников"
//         ]
//     ], 
//     "userId" : Number(230103105), 
//     "title" : "Новий 1", 
//     "maxPeopleInGroup" : Number(11)
// };

// let spr = new SpreadSheetSpecialTables(obj);
// spr.createTablesInSpreadSheet().then((res) => {
//     console.log(res);
// }).catch(e => console.log(e));

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
    console.log(ctx.message);
    console.log(ctx.state.command);
    let ans = new AnswerCommand("1WyutsP44ejjomoZR_GuGJB9uPJk1SrHFue07BioIGxo", 0, "sheet1", ctx.state.command.args);
    queue.add(ans.onCommandCallback.bind(ans));
});
bot.on("new_chat_members", (ctx) => {
    console.log("New member");
    const message = ctx.message;
    console.log(ctx.from);
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

let credentials;
fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    credentials = JSON.parse(content);
       // authorize(credentials, listMajors);

    // authorize(credentials, (auth) => {
    //     console.log(auth);
    //     const sheets = google.sheets({ version: 'v4', auth })
    //     let request = {
    //         resource: {
    //             properties: {
    //                 title: "Test"
    //             }
    //         }
    //         //auth
    //             // TODO: Add desired properties to the request body.
    //     };
    //     sheets.spreadsheets.create(request, (err,res) => {
    //         if (err)
    //             return console.log(err);
    //         console.log(res);
    //     });
    // });
    console.log("Credentials loaded");
});

bot.command('create', (ctx) => {
    createCommand = new CreateCommand();
    beginCommand = null;
    createCommand.onCommandCallback(ctx);
})

bot.command("begin", (ctx) => {
    let id  = ctx.from.id;
    console.log("id type", typeof id);
    beginCommand = new BeginCommand();
    сreateCommand = null;
    // beginCommand.createAndModifySpreadSheet().then((res) => {
    //     console.log(res.data);
    // }).catch((e) => {
    //     console.log(e.message);
    // });
    beginCommand.onCommandCallback(ctx);
})
bot.on("text", (ctx) => {
    if (createCommand && !createCommand.isFinished()) {
        createCommand.onTextCallback(ctx);
        if (createCommand.isFinished()) {
            const resultObj = createCommand.getResultObj();
            const newDist = new DistributionModel(resultObj);
            createCommand = null;
            newDist.save().then((res) => {
                console.log("succesfully saved");
            }).catch((e) => {
                console.log("error while saving", e.message);
            })
        }
    }

    if (beginCommand && beginCommand.ready && !beginCommand.isFinished()) {
        beginCommand.onTextCallback(ctx);
    }
    // const text = ctx.message.text;
    // if (chooseChat) {
    //     let chat = current_bot_chats.find((elem) => {
    //         return elem.title === text;
    //     });
    //     if (!chat) {
    //         return ctx.reply(`Бот зараз не знаходиться в чаті "${text}"`);
    //     }
    //     obj.chatId = chat.id;
    //     chooseChat = false;
    //     console.log("Chat id inited");
    //     ctx.reply("Введіть назви предметів \n(одне повідомлення, по одному предмету на рядок)", Markup.removeKeyboard());
    //     chooseSubjects = true;
    // } else if (chooseSubjects) {
    //     if (text.toLowerCase() === "ok") {
    //         chooseSubjects = false;
    //         chooseInfo = true;
    //         curSubjectIndex = 0;
    //         ctx.reply(`Введіть інформацію про групи з предмету "${obj.subjects[curSubjectIndex]}"`, Markup.removeKeyboard());
    //         return;
    //     }
    //     let subjects = text.split("\n");
    //     obj.subjects = subjects;

    //     console.log(subjects);
    //     ctx.reply(`Обрано предмети: ${subjects.join(', ')}\n(Введіть ще раз, якщо хочете змінити вибір)`,Markup.
    //     keyboard(["Ok"])
    //     .oneTime()
    //     .resize()
    //     .extra());        
    // } else if (chooseInfo) {
    //     if (text.toLowerCase() === "ok") {
    //         ++curSubjectIndex;
    //         if (curSubjectIndex >= obj.subjects.length) {
    //             chooseMaxGroopNumber = true;
    //             chooseInfo = false;
    //             return ctx.reply(`Введіть максимальну кількість людей в групі`, Markup.removeKeyboard());
    //         }
    //         return ctx.reply(`Введіть інформацію про групи з предмету "${obj.subjects[curSubjectIndex]}"`, Markup.removeKeyboard());
    //     }
    //     let info = text.split("\n");
    //     if (!obj.subjectsInfo)
    //         obj.subjectsInfo = [];
    //     obj.subjectsInfo.push(info);
    //     ctx.reply(`Обрано інформацію: ${info.join(', ')}\n(Введіть ще раз, якщо хочете змінити вибір)`,Markup.
    //     keyboard(["Ok"])
    //     .oneTime()
    //     .resize()
    //     .extra());   
    // } else if (chooseMaxGroopNumber) {
    //     const number = Number(text);
    //     if (isNaN(number)) {
    //         return ctx.reply("Відповідь повинна бути числом", Markup.removeKeyboard());
    //     }
    //     obj.maxPeopleInGroup = number;
    //     ctx.reply("Ви іспішно створили новий розподіл, щоб розпочати його введіть /begin", Markup.removeKeyboard());

    //     authorize(credentials, (auth) => {
    //     console.log(auth);
    //     const sheets = google.sheets({ version: 'v4', auth })
    //     let request = {
    //         resource: {
    //             properties: {
    //                 title: "Test"
    //             }
    //         }
    //         //auth
    //             // TODO: Add desired properties to the request body.
    //     };
    //     sheets.spreadsheets.create(request, (err,res) => {
    //         if (err)
    //             return console.log(err);
    //         obj.spreadsheetId = res.data.spreadsheetId;
    //         ctx.reply(`Таблиця для зберігання результатів створена: ${res.data.spreadsheetUrl}`, Markup.removeKeyboard());
    //         //console.log(res);
    //     });
    //});
    
        
        // sheets.spreadsheets.values.ggiet({
        //     spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        //     range: 'Class Data!A2:E',
        // }.then((res) => {

        // }) (err, res) => {
        //     if (err) return console.log('The API returned an error: ' + err);
        //     const rows = res.data.values;
        //     if (rows.length) {
        //         console.log('Name, Major:');
        //         // Print columns A and E, which correspond to indices 0 and 4.
        //         rows.map((row) => {
        //             console.log(`${row[0]}, ${row[4]}`);
        //         });
        //     } else {
        //         console.log('No data found.');
        //     }
        // });
    //}

})


// bot.on("message", (ctx) => {
//     console.log("Message sent", JSON.stringify(ctx.update));
// } )
// Login widget events


// Start polling
bot.startPolling()
// // Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//     if (err) return console.log('Error loading client secret file:', err);
//     // Authorize a client with credentials, then call the Google Sheets API.
//     authorize(JSON.parse(content), listMajors);
// });

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */ 
function listMajors(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        range: 'Class Data!A2:E',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            console.log('Name, Major:');
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map((row) => {
                console.log(`${row[0]}, ${row[4]}`);
            });
        } else {
            console.log('No data found.');
        }
    });
}









// bot.on("callback_query", (ctx) => {
//     console.log(ctx.callbackQuery.data);
// })
//   bot.hears('🔍 Search', ctx => ctx.reply('Yay!'))
//   bot.hears('📢 Ads', ctx => ctx.reply('Free hugs. Call now!'))
  
//   bot.command('special', (ctx) => {
//     return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
//       return markup.resize()
//         .keyboard([
//           markup.contactRequestButton('Send contact'),
//           markup.locationRequestButton('Send location')
//         ])

//     }))
//   })
  
//   bot.command('pyramid', (ctx) => {
//     return ctx.reply('Keyboard wrap', Extra.markup(
//       Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
//         wrap: (btn, index, currentRow) => currentRow.length >= (index + 1) / 2
//       })
//     ))
//   })
  
//   bot.command('simple', (ctx) => {
//     return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>', Extra.markup(
//       Markup.keyboard(['Coke', 'Pepsi'])
//     ))
//   })
  
//   bot.command('inline', (ctx) => {
//     return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
//       m.inlineKeyboard([
//         m.callbackButton('Coke', 'Coke'),
//         m.callbackButton('Pepsi', 'Pepsi')
//       ])))
//   })
  
//   bot.command('random', (ctx) => {
//     return ctx.reply('random example',
//       Markup.inlineKeyboard([
//         Markup.callbackButton('Coke', 'Coke'),
//         Markup.callbackButton('Dr Pepper', 'Dr Pepper'),
//         Markup.callbackButton('Pepsi', 'Pepsi')
//       ]).extra()
//     )
//   })
  
//   bot.command('caption', (ctx) => {
//     return ctx.replyWithPhoto({ url: 'https://picsum.photos/200/300/?random' },
//       Extra.load({ caption: 'Caption' })
//         .markdown()
//         .markup((m) =>
//           m.inlineKeyboard([
//             m.callbackButton('Plain', 'plain'),
//             m.callbackButton('Italic', 'italic')
//           ])
//         )
//     )
//   })
  
//   bot.hears(/\/wrap (\d+)/, (ctx) => {
//     return ctx.reply('Keyboard wrap', Extra.markup(
//       Markup.keyboard(['one', 'two', 'three', 'four', 'five', 'six'], {
//         columns: parseInt(ctx.match[1])
//       })
//     ))
//   })
  
//   bot.action('Dr Pepper', (ctx, next) => {
//     return ctx.reply('👍').then(() => next())
//   })
  
//   bot.action('plain', async (ctx) => {
//     ctx.editMessageCaption('Caption', Markup.inlineKeyboard([
//       Markup.callbackButton('Plain', 'plain'),
//       Markup.callbackButton('Italic', 'italic')
//     ]))
//   })
  
//   bot.action('italic', (ctx) => {
//     ctx.editMessageCaption('_Caption_', Extra.markdown().markup(Markup.inlineKeyboard([
//       Markup.callbackButton('Plain', 'plain'),
//       Markup.callbackButton('* Italic *', 'italic')
//     ])))
//   })
  
//   bot.action(/.+/, (ctx) => {
//     return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
//   })