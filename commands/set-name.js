const {UserModel} = require("../Models/User");

class SetNameCommand {
    constructor() {
        this.ctx = null;
        this.finished = false;
        this.ready = true;
    }
    isFinished() {
        return this.finished;
    }
    setCtx(ctx) {
        this.ctx = ctx;
    }
    onCommandCallback(ctx) {
        const args = ctx.state.command.args;
        if (!args)
            return ctx.reply("Введіть, будь ласка, свій ПІБ");
        const splitArguments = ctx.state.command.splitArgs;
        if (splitArguments.length !== 3) {
            ctx.reply(`Можливо в ПІБ наявна помилка, перевірте, будь ласка`);
        }
        const id = ctx.from.id;
        UserModel.findOne({userId: id}).then((res) => {
            if (!res) {
                const user = new UserModel({
                    userId: id,
                    userName: args
                });
                return user.save().then((res) => {
                    ctx.reply("Ви успішно встановили своє ім’я")
                }).catch(e => console.log("Error happened while saving a new user:", e.message));
            }
            res.userName = args;
            return res.save().then((res) => {
                console.log(res);
                ctx.reply(`Ви успішно оновили своє ім’я`);
            })
        }).catch(e => console.log(e.message));
    }
    onTextCallback(ctx) {
        const text = ctx.message.text;
        const splitArguments = text.split(" ");
        if (splitArguments.length !== 3) {
            ctx.reply(`Можливо в ПІБ наявна помилка, перевірте, будь ласка`);
        }
        const id = ctx.from.id;
        UserModel.findOne({userId: id}).then((res) => {
            if (!res) {
                const user = new UserModel({
                    userId: id,
                    userName: text
                });
                return user.save().then((res) => {
                    this.finished = true;
                    ctx.reply("Ви успішно встановили своє ім’я")
                }).catch(e => console.log("Error happened while saving a new user:", e.message));
            }
            res.userName = text;
            return res.save().then((res) => {
                this.finished = true;
                //console.log(res);
                ctx.reply(`Ви успішно оновили своє ім’я`);
            })
        }).catch(e => console.log(e));
    }
}

module.exports = {
    SetNameCommand
}

