class PromiseQueue {
    constructor() {
        this.currentPromises = [];
        this.promiseNumb = 0;
    }

    add(promise) {
        this.currentPromises.push(promise);
        if (this.currentPromises.length === 1)
            this.run().then((results) => {

            }).catch(e => {throw e});
    }

    async run() {
        let results = [];
        while (this.currentPromises.length > 0) {
            let result = await this.currentPromises[0]();
            //console.log(`Promise ${++this.promiseNumb} waited`);
            results.push(result);
            this.currentPromises.shift();
        }
        return results;
    }
}

module.exports = {
    PromiseQueue
}