const {makeEnum, makeSequentialEnum} = require("./../utils/enum");
const { DistributionModel} = require("../Models/Distribution");

const Markup = require('telegraf/markup')
class CreateCommand {

    createSequence() {
        this.stages["setTitle"].next = this.stages["setSubjects"];
    }
    constructor() {
        this.stagesStrings = ["setTitle", "setSubjects", "setSubjectsInfo", "setPeopleInGroup"];
        const stageEnum = makeSequentialEnum(...this.stagesStrings);
        this.stages = stageEnum.enumObj;
        this.ctx = null;
        this.currentStage = this.stages["setTitle"];
        this.next = stageEnum.next;
        this.resultObj = {userId: null};
        this.curSubjectIndex = -1;
        this.ready = true;
        this.okButton = Markup.
        keyboard(["Ok"])
        .resize()
        .extra();
    }

    

    setCtx(ctx) {
        this.ctx = ctx;
    }

    setNextStage() {
        this.currentStage = this.next[this.currentStage];
    }
    
    onCommandCallback(ctx) {
        this.resultObj.userId = ctx.from.id;
        ctx.reply(`Введіть назву розподілу`);
    }

    getResultObj() {
        return this.resultObj;
    }

    isFinished() {
        return !this.currentStage;
    }
    setTitle(text) {
        if (this.resultObj.title && text.toLowerCase() === "ok") {
            this.ctx.reply("Введіть назви предметів \n(одне повідомлення, по одному предмету на рядок)", Markup.removeKeyboard().extra());
            this.setNextStage();
            return {
                finished: false,
                resultObj: this.resultObj
            }
        }
        this.resultObj.title = text;
        this.ctx.reply(`Ви обрали назву "${text}"\n(Введіть заново, якщо хочете змінити)`, this.okButton);
    }

    setSubjects(text) {
        if (this.resultObj.subjects && text.toLowerCase() === "ok") {
            this.curSubjectIndex = 0;
            this.setNextStage();
            this.ctx.reply(
                `Введіть інформацію про групи з предмету "${this.resultObj.subjects[this.curSubjectIndex]}"`,
                Markup.removeKeyboard().extra());
                return {
                    finished: false,
                    resultObj: this.resultObj
                };
        }
        let subjects = text.split("\n");
        this.resultObj.subjects = subjects;
        console.log(subjects);
        this.ctx.reply(`Обрано предмети: ${subjects.join(', ')}\n(Введіть ще раз, якщо хочете змінити вибір)`, this.okButton);   
    }
    
    setSubjectInfo(text) {
        if (this.resultObj.subjectsInfo 
            && this.resultObj.subjectsInfo[this.curSubjectIndex]
            && this.resultObj.subjectsInfo[this.curSubjectIndex][0][0].toLowerCase() !== "ok"
            && text.toLowerCase() === "ok") {
            ++this.curSubjectIndex;
            if (this.curSubjectIndex >= this.resultObj.subjects.length) {
                this.setNextStage();
                this.ctx.reply(`Введіть максимальну кількість людей в групі`, Markup.removeKeyboard().extra());
                return {
                    finished: false,
                    resultObj: this.resultObj
                };
            }
            return this.ctx.reply(`Введіть інформацію про групи з предмету "${this.resultObj.subjects[this.curSubjectIndex]}"`, Markup.removeKeyboard().extra());
        }
        let info = text.split("\n");
        if (!this.resultObj.subjectsInfo)
            this.resultObj.subjectsInfo = [];
        this.resultObj.subjectsInfo.push(info);
        this.ctx.reply(`Обрано інформацію: ${info.join(', ')}\n(Введіть ще раз, якщо хочете змінити вибір)`, this.okButton);   
        
    }

    setMaxPeopleInGroup(text) {
        const number = Number(text);
        if (isNaN(number)) {
            return this.ctx.reply("Відповідь повинна бути числом", Markup.removeKeyboard().extra());
        }
        this.resultObj.maxPeopleInGroup = number;
        this.ctx.reply("Ви іспішно створили новий розподіл, щоб розпочати його введіть /begin", Markup.removeKeyboard().extra());
        const newDist = new DistributionModel(this.resultObj);
        newDist.save().then((res) => {
            console.log("succesfully saved");
        }).catch((e) => {
            console.log("error while saving", e.message);
        })
        this.setNextStage();        
        return {
            finished: true,
            resultObj: this.resultObj
        };
    }


    onTextCallback(ctx) {
        if (!this.currentStage || ctx.from.id !== this.resultObj.userId)
            return;
        const stages = this.stages;
        const stagesNames = this.stagesStrings;
        this.setCtx(ctx);
        const text = ctx.message.text;
        const functions = [
            this.setTitle.bind(this),
            this.setSubjects.bind(this),
            this.setSubjectInfo.bind(this),
            this.setMaxPeopleInGroup.bind(this)
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
    CreateCommand
}