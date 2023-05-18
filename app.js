//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
require('dotenv').config()
const mongoDBURL = process.env.mongoDBURL;
 
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Admin:Admin@atlascluster.sif4xg3.mongodb.net/todolistDB");
const itemsSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  }
});
const customListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [itemsSchema]
});
const dailyList = mongoose.model('dailyList', itemsSchema);
const customList = mongoose.model('customLists', customListSchema);
const firstItem = new dailyList({
  item: "Wake Up Early 🥱"
});

app.use((req, res, next) => {
  if (req.originalUrl === '/favicon.ico') {
    res.status(204).json({ nope: true });
  } else {
    next();
  }
});
app.get("/", function (req, res) {
  dailyList.find()
    .then(foundList => {
      if (foundList.length == 0) {
        firstItem.save();
        res.redirect("/");
      }
      else {
        res.render("list", { listTitle: "Daily to-do List", newListItems: foundList });
      }
    })
    .catch(err => {
      console.log(err);
    });
});
app.get("/:customListName", function (req, res) {
  nList = _.capitalize(req.params.customListName);
  customList.findOne({ name: nList })
    .then(foundList => {
      if (!foundList) {
        console.log("List does not exists");
        console.log(`Creating new List "${nList}" in DB....`);
        const list = new customList({
          name: nList,
          items: firstItem
        });
        list.save();
        res.redirect("/" + nList);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(err => {
      console.log(err);
    })
});

app.post("/", function (req, res) {
  const nList = req.body.list;
  const nItem = req.body.newItem;
  const newItem = new dailyList({
    item: nItem
  });
  console.log(`${nList} list updated...`);
  if (nList === "Daily") {

    dailyList.insertMany(newItem);
    res.redirect("/");
  } else {
    customList.findOne({ name: nList })
      .then(foundList => {
        foundList.items.push(newItem);
        foundList.save();
      });
    res.redirect("/" + nList);
  }
});

app.post("/delete", function (req, res) {
  const dItemId = req.body.checkbox;
  const nList = req.body.listType;
  if (nList === "Daily") {
    dailyList.findOneAndRemove({ _id: dItemId })
      .then((Obj) => {
        console.log(`Item "${Obj.item}" has been deleted `);
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    customList.findOneAndUpdate({ name: nList }, { $pull: { items: { _id: dItemId } } })
      .then(() => {
        res.redirect("/" + nList);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

const port = process.env.PORT || 3000
app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
