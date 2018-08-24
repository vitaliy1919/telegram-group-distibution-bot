const makeEnum = (... strings) => {
    let enumObj = {};
    let args = [...strings];
    for (let i = 0; i < args.length; i++)
        enumObj[args[i]] = Symbol(args[i]);
    return Object.freeze(enumObj);
}
const makeSequentialEnum = (... strings) => {
    let enumObj = {};
    let next = {}
    let args = [...strings];
    for (let i = 0; i < args.length - 1; i++) {
        enumObj[args[i]] = Symbol(args[i]);
        enumObj[args[i + 1]] = Symbol(args[i + 1]);
        next[enumObj[args[i]]] = enumObj[args[i + 1]]
    }
    return {enum: Object.freeze(enumObj), next};
}
module.exports = {
    makeEnum,
    makeSequentialEnum
}