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
    enumObj[strings[0]] = Symbol(strings[0]);

    for (let i = 0; i < strings.length - 1; i++) {
        enumObj[strings[i + 1]] = Symbol(strings[i + 1]);
        next[enumObj[strings[i]]] = enumObj[strings[i + 1]]
    }
    return {enumObj: Object.freeze(enumObj), next};
}
module.exports = {
    makeEnum,
    makeSequentialEnum
}