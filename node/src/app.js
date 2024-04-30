const express = require("express");
const body_parser = require("body-parser");
const userRouter = require("./routes/user_route");
const path = require('path');
const app = express();

const mediaPath = path.join(__dirname, 'documents');
const imagePath = path.join(__dirname, 'profileLogo');
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));
app.use(body_parser.json());
const logoPath = path.join(__dirname, 'logo');
app.use('/logo', express.static(logoPath));
app.use('/documents', express.static(mediaPath));
app.use('/profileLogo', express.static(imagePath));
app.use('/',userRouter);


module.exports = app