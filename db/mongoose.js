const mongoose = require("mongoose");
let dbPath = "mongodb://localhost:27017/DistributionBot";
mongoose.connect(dbPath, { useNewUrlParser: true }).then(()=> {
    console.log("Connection to MongoDB is successful!")
})
.catch((err)=>{
    console.log("Error occurred while connecting to the database");
    console.log(JSON.stringify(err, undefined, 2));
});

module.exports = {
    mongoose, 
    dbPath
}