const { json } = require("body-parser");
var express = require("express");
const db = require("../modules/db");
var ObjectID = require('mongodb').ObjectID;
var router = express.Router();

router.get('/', function (req, res, next) {
  db.db.collection('tasks').find().toArray().then((users) => {
    res.json(users);
  });
});

router.post('/addTask', function (req, res, next) {
  const { task_name, done } = req.body;

  db.db.collection('tasks').insertOne({
    task_name: task_name,
    done: done,
  });
  res.json(200, {});
});

router.put('/updateTask', function (req, res, next) {
  const { _id, done } = req.body;

  try {
    db.db.collection('tasks').updateOne({ '_id': ObjectID(_id) }, { $set: { done: done } });
    res.json(200, {});
  } catch (e) {
    res.statusMessage = 'Tâche innexistante !';
    res.status('404').end();
  }
});

router.delete('/deleteTask', function (req, res, next) {
  const { _id } = req.body;

  try {
    db.db.collection('tasks').deleteOne({ '_id': ObjectID(_id)});
    res.json(200, {});
  } catch (e) {
    res.statusMessage = 'Tâche innexistante !';
    res.status('404').end();
  }
});

module.exports = {
  router: router
}