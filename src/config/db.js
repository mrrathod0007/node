const mongoose = require("mongoose")


mongoose.connect("mongodb+srv://mrrathod0007:Mahi9036%40yahoo.com@cluster0.t2hxubb.mongodb.net/")

.then(()=>{
    console.log("MongoDb Conntected with db")
})
.catch((error)=>{
    console.log(`failed to connect with db ${error}`)
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