const express = require("express");
const body_parser = require("body-parser");
const userRouter = require("./routes/user_route");
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();
dotenv.config();
const port = process.env.PORT || 1000;
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB Connected');
    // Start the server after MongoDB connection is established
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
  });

app.use(body_parser.json());
app.use('/documents', express.static('G:/nodejsproject/src/documents'));
app.use('/',userRouter);


module.exports = app