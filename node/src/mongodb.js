const mongoose = require("mongoose")

mongoose.connect("mongodb://localhost:27017/MyShop")


.then(()=>{
    console.log("MongoDb Conntected")
})
.catch(()=>{
    console.log("failed to connect")
})

const LoginSchema = new mongoose.Schema({
    name:{
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