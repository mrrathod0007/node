const mongoose = require("mongoose")
require('dotenv').config();

// mongoose.connect("mongodb://127.0.0.1:27017/MyShop")
const conn =  mongoose.connect(process.env.MONGO_URL)

.then(()=>{
    console.log(`MongoDb Conntected: ${conn.connection.host}`)
})
.catch(()=>{
    console.log("failed to connect")
})

const LoginSchema = new mongoose.Schema({
    mobile:{
        type:String,
        required:true
    },
    
    password:{
        type:String,
        required:true
    }
})

const collection = new mongoose.model("LoginCollection",LoginSchema)

module.exports = collection