const {makeEnum, makeSequentialEnum} = require("./enum");
 
class CreateCommand {
    createSequence() {
        this.stages["setTitle"].next = this.stages["setSubjects"];
    }
    constructor() {
        const stageEnum = makeSequentialEnum("setTitle", "setSubjects", "setSubjectsInfo", "setPeopleInGroup");
        this.stages = stageEnum.enumObj;
        this.ctx = null;
        this.currentStage = this.stages["setTitle"];
        this.next = stageEnum.next;
    }

    setCtx(ctx) {
        this.ctx = ctx;
    }

    setNextStage() {

    }
}

let a = new CreateCommand();