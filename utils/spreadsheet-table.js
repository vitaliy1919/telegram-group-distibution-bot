const {loadCredentials, authorize} = require("./google-spreadsheets-auth");
const { google } = require('googleapis');
const util = require('util');

class SpreadSheetSpecialTables {
    constructor(valuesObj) {
        this.valuesObj = valuesObj;
        this.auth = null;
        this.sheets = null;

    }

    async createSpreadSheet() {
        await loadCredentials();
        this.auth = await authorize();
        this.sheets = google.sheets({ version: 'v4', auth:  this.auth })
        let request = {
            resource: {
                properties: {
                    title: this.valuesObj.title
                }
            }
        };
        let create = util.promisify(this.sheets.spreadsheets.create);
        let spreadsheet = await create(request);
        return spreadsheet;
    }
    async createTableInSpreadSheet(spreadsheetId, sheetId, sheetTitle, startCollumn, index) { 
        let batchUpdate = util.promisify(this.sheets.spreadsheets.batchUpdate);
        let infoLength = this.valuesObj.subjectsInfo[index].length;
        let budata = await batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    mergeCells: {
                        range: {
                            sheetId,
                            startRowIndex: 1,
                            endRowIndex: 2,
                            startColumnIndex: startCollumn,
                            endColumnIndex: startCollumn + infoLength
                        },
                        mergeType: "MERGE_ALL"
                    }
                }, {
                    updateBorders: {
                        range: {
                            sheetId,
                            startRowIndex: 1,
                            endRowIndex: 3 + this.valuesObj.maxPeopleInGroup,
                            startColumnIndex: startCollumn,
                            endColumnIndex: startCollumn + infoLength
                        },
                        top: {
                            style: "SOLID_THICK"
                        },
                        bottom: {
                            style: "SOLID_THICK"
                        },
                        left: {
                            style: "SOLID_THICK"
                        },
                        right: {
                            style: "SOLID_THICK"
                        }
                    }
                }, {
                    updateBorders: {
                        range: {
                            sheetId,
                            startRowIndex: 2,
                            endRowIndex: 3,
                            startColumnIndex: startCollumn,
                            endColumnIndex: startCollumn + infoLength
                        },
                        bottom: {
                            style: "SOLID_THICK"
                        },
                        top: {
                            style: "SOLID_THICK"
                        }
                    }
                }, {
                    updateBorders: {
                        range: {
                            sheetId,
                            startRowIndex: 1,
                            endRowIndex: 3 + this.valuesObj.maxPeopleInGroup,
                            startColumnIndex: startCollumn,
                            endColumnIndex: startCollumn + infoLength - 1
                        },

                        right: {
                            style: "solid"
                        }
                    }
                }, {
                    repeatCell: {
                        range: {
                            sheetId,
                            startRowIndex: 1,
                            endRowIndex: 3 + this.valuesObj.maxPeopleInGroup,
                            startColumnIndex: startCollumn,
                            endColumnIndex: startCollumn + infoLength
                        },
                        cell: {
                            userEnteredFormat: {
                                horizontalAlignment: "CENTER",
                                verticalAlignment: "MIDDLE"
                            }
                        },
                        fields: "userEnteredFormat(horizontalAlignment,verticalAlignment)"
                    },

                }]
            },
            includeSpreadsheetInResponse: false
        });
        let update = util.promisify(this.sheets.spreadsheets.values.update);
        let letterStart = String.fromCharCode("A".charCodeAt(0) + startCollumn);
        let letterEnd = String.fromCharCode(letterStart.charCodeAt(0) + infoLength - 1);
        let cellVals = await update({
            spreadsheetId,
            range: `${sheetTitle}!${letterStart}2:${letterEnd}2`,
            valueInputOption: "USER_ENTERED",
            resource: {
                "majorDimension": "ROWS",
                values: [[this.valuesObj.subjects[index]]]
            }
        });
        let cellVals1 = await update({
            spreadsheetId,
            range: `${sheetTitle}!${letterStart}3:${letterEnd}${3}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                "majorDimension": "ROWS",
                values: [this.valuesObj.subjectsInfo[index]]
            }
        });
        let bu = await batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    autoResizeDimensions: {
                        dimensions: {
                            sheetId,
                            dimension: "COLUMNS",
                            startIndex: startCollumn,
                            endIndex: startCollumn + infoLength
                        }
                    }
                }]
            }
        })
        console.log("bu", bu);
    }
    async createTablesInSpreadSheet() {
        let spreadsheet = await this.createSpreadSheet();
        let spreadsheetId = spreadsheet.data.spreadsheetId;
        let sheetId = spreadsheet.data.sheets[0].properties.sheetId;
        let sheetTitle = spreadsheet.data.sheets[0].properties.title;
        let startColumn = 1;
        for (let i = 0; i < this.valuesObj.subjects.length; ++i) {
            await this.createTableInSpreadSheet(spreadsheetId, sheetId, sheetTitle, startColumn, i);
            startColumn += 2 + this.valuesObj.subjectsInfo[i].length;
        }
        return spreadsheet;
    }

}

module.exports = {
    SpreadSheetSpecialTables
}