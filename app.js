//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require('lodash');


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
const uri = "mongodb+srv://lawrencevincent453:cVbLsJTI54vacfQ7@cluster0.0ldculs.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Create a Mongoose connection and listen for the "connected" event
const db = mongoose.connection;
db.on('connected', () => {
  console.log("Successfully connected to MongoDB");
});

// Define item schema and model
const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

// Use async/await to insert defaultItems into the database
async function insertDefaultItems() {
  try {
    const count = await Item.countDocuments();
    if (count === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully inserted documents");
    }
  } catch (err) {
    console.error(err);
  }
}

// Default items
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

// Call the function to insert default items
insertDefaultItems();

// Define list schema and model
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

// Route for the root path
app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    res.render("list", { listTitle: "Today", newListItems: foundItems });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to handle item deletion
app.post("/delete", async (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully Deleted Item");
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.pull({ _id: checkedItemId });
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        // List not found
        res.status(404).send("List not found");
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});


// Route for custom lists
// ...

// Route for custom lists
app.get("/:customListName", function (req, res) {
  let customListName = _.capitalize(req.params.customListName); // Declare using let

  async function checkList() {
    try {
      const foundList = await List.findOne({ name: customListName }).exec();
      if (!foundList) {
        //Create a new list
        // Create a new List instance with default items
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        // Save the list to the database
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    } catch (err) {
      console.error("Error finding list:", err);
    }
  }

  // Call the asynchronous function
  checkList();
});

// ...



app.post("/", async (req, res) => {
  try {
    const newItem = req.body.newItem;
    const listName = req.body.list;

    const newItemDoc = new Item({
      name: newItem
    });

    if (listName === "Today") {
      await newItemDoc.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(newItemDoc);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        // Log the listName for debugging
        console.error("List not found. listName:", listName);

        // Handle case where the specified list is not found
        res.status(404).send("List not found");
      }
    }
  } catch (error) {
    console.error("Error saving item:", error);
    res.status(500).send("Internal Server Error");
  }
});


// About page route
app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
