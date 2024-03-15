const mongoose = require("mongoose")
require('dotenv').config();

const username = encodeURIComponent("mrrathod0007");
const password = encodeURIComponent("Mahi9036@yahoo.com");
const cluster = "cluster0";
const authSource = "<authSource>";
const authMechanism = "<authMechanism>";
// mongodb+srv://mrrathod0007:Mahi9036@yahoo.com@cluster0.t2hxubb.mongodb.net/

let uri =
  `mongodb+srv://${username}:${password}@${cluster}.t2hxubb.mongodb.net/`;
const client = new MongoClient(uri);

async function run() {
    try {
      await client.connect();
      const database = client.db("<dbName>");
      const ratings = database.collection("<collName>");
      const cursor = ratings.find();
      await cursor.forEach(doc => console.dir(doc));
    } finally {
      await client.close();
    }
  }
  run().catch(console.dir);
// mongoose.connect("mongodb://127.0.0.1:27017/MyShop")
// const conn = await mongoose.connect(process.env.MONGO_URL)

// .then(()=>{
//     console.log(`MongoDb Conntected: ${conn.connection.host}`)
// })
// .catch(()=>{
//     console.log("failed to connect")
// })

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