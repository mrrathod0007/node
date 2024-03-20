const app = require("./app");
const db = require("./config/db");
require('dotenv').config();

const {  UserModel, UserAddTable,Menu, Invoice } = require("../src/model/user_model");
const port = process.env.PORT || 2000;



app.get("/",(req,res)=>{
    res.send("Hi this is my first project")
})


app.listen(port, ()=>{
    console.log(`Server running in this port http://localhost:${port}`);
});








// const { log } = require("console")
// const express = require("express")
// const app = express()
// const path = require("path")
// const hbs = require("hbs")
// const collection = require('./mongodb')

// const tempelatePath = path.join(__dirname,'../tempelates')

// app.use(express.json())
// app.set("view engine","hbs")
// app.set("views",tempelatePath)
// app.use(express.urlencoded({extended:false}))

// app.get("/",(req,res)=>{
//     res.render("signup")
// })
// app.get("/signup",(req,res)=>{
//     res.render("signup")
// })

// app.post("/signup", async(req,res)=>{
//     const data = {
//         name: req.body.name,
//         password:req.body.password
//     }

//     await collection.insertMany([data])

//     res.render("login")

// })

// app.post("/login", async(req,res)=>{
//   try{
//     const check = await collection.findOne({name:req.body.name})
//     if(check.password === req.body.password){
//         res.render("home")
//     }
//     else{
//         res.send("wrong password")
//     }
//   }
//   catch{
//     res.send("wrong Details")
//   }

// })

// app.listen(3000,()=>{
//     console.log("port connected");
// })
