const express = require("express");
const body_parser = require("body-parser");
const userRouter = require("./routes/user_route");

const app = express();




app.use(body_parser.json());
app.use('/documents', express.static('G:/nodejsproject/src/documents'));
app.use('/',userRouter);


module.exports = app