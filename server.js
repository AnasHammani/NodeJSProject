const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = 4000;
const db = require('./modules/db');

const usersRouter = require('./api/users').router;
const tasksRouter = require('./api/tasks').router;

db.connect();


app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());


app.use(cors());
app.use("/users", usersRouter);
app.use("/tasks", tasksRouter);

app.use(bodyParser.json());
app.listen(PORT, function() {
    console.log("Server is running on Port: " + PORT);
}); 