const express = require("express");
const body_parser = require("body-parser");
const userRouter = require("./routes/user_route");
const path = require('path');
const app = express();


const mediaPath = path.join(__dirname, 'documents');
const imagePath = path.join(__dirname, 'profileLogo');
app.use(body_parser.json());
app.use('/documents', express.static(mediaPath));
app.use('/profileLogo', express.static(imagePath));
app.use('/',userRouter);


module.exports = app