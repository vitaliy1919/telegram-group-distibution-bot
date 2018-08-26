const {loadCredentials, authorize} = require("./google-spreadsheets-auth");
const { google } = require('googleapis');
const util = require('util');
class AnswerCommand {
    constructor(spreadsheetId,  sheetId, sheetTitle, text) {
        this.spreadsheetId = spreadsheetId;
        this.sheetId = sheetId;
        this.sheetTitle = sheetTitle;
        this.text = text;
    }

    async getValues() {
        await loadCredentials();
        let auth = await authorize();
        let sheets = google.sheets({ version: 'v4', auth })
        let get = util.promisify(sheets.spreadsheets.values.get);
        let cellVals1 = await get({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetTitle}!B4:B14`,
            majorDimension: "COLUMNS"
        });
        console.log(cellVals1);
        return cellVals1;

    }

    async updateValue(length) {
        await loadCredentials();
        let auth = await authorize();
        let sheets = google.sheets({ version: 'v4', auth })
        let update = util.promisify(sheets.spreadsheets.values.update);
        
        let cellVals = await update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetTitle}!B${4 + length}:B${4 + length}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                "majorDimension": "COLUMNS",
                values: [[this.text]]
            }
        });
    }
    async complexPromise() {
        let res = await this.getValues();
        let length = 0
        if (res.data.values)
            length = res.data.values[0].length;
        console.log("length:", length);

        await this.updateValue(length);
    }
    onCommandCallback() {
        return this.complexPromise();
    }
}

module.exports = {
    AnswerCommand
}