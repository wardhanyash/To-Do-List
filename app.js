const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public")); // TO ADD CSS FILE

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
); //DATABASE

const itemsSchema = new mongoose.Schema({
  // SCHEMA
  name: String,
});

const Item = mongoose.model("Item", itemsSchema); // GENERALLY MODEL'S NAME MUST BE SINGULAR FORM OF DATABASE NAME AND START WITH CAPITAL LETTER

const buyFood = new Item({
  name: "Buy Food",
});

const cookFood = new Item({
  name: "Cook Food",
});

const eatFood = new Item({
  name: "Eat Food",
});

const defaultItems = [buyFood, cookFood, eatFood];

// NEW LIST COLLECTIONS

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully Inserted Items");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne(
    {
      name: customListName,
    },
    function (err, result) {
      if (!err) {
        if (result) {
          res.render("list", {
            listTitle: result.name,
            newListItems: result.items,
          });
        } else {
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customListName);
        }
      }
    }
  );
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/", function (req, res) {
  //console.log(req.body);
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne(
      {
        name: listName,
      },
      function (err, foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    );
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function () {
  console.log("Server is up and running.");
});
