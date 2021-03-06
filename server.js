const express = require("express");
const app = express();

const cors = require("cors");
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoose = require("mongoose");
const { response } = require("express");
const { Schema } = mongoose;
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
);

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const userSchema = new Schema({
  username: { type: String, required: true },
  count: Number,
  log: [exerciseSchema],
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (!data) {
      res.send("No users");
    } else {
      res.json(data);
    }
  });
});

app.post("/api/users", (req, res) => {
  const newUser = new User({ username: req.body.username });
  newUser.save((err, data) => {
    if (err) {
      res.json("username taken");
    } else {
      res.json({ username: data.username, _id: data.id });
    }
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;

  let newExercise = new Exercise({
    description,
    duration,
    date,
  });

  if (newExercise.date) {
    newExercise.date = newExercise.date.toDateString;
    console.log(newExercise.date);
  }

  if (newExercise.date === "") {
    newExercise.date = new Date().toISOString().substring(0, 10);
  }
  const saveExercise = new Exercise({
    userId: req.params._id,
    description,
    duration,
    date,
  });

  await saveExercise.save();
  User.findByIdAndUpdate(
    req.params._id,
    { $push: { log: newExercise } },
    { new: true },
    (error, updatedUser) => {
      console.log(updatedUser.log[0].description);
      if (!error) {
        let responseObject = {};
        responseObject["username"] = updatedUser.username;
        responseObject["description"] = updatedUser.log[0].description;
        responseObject["duration"] = updatedUser.log[0].duration;
        responseObject["date"] = updatedUser.log[0].date.toDateString();
        responseObject["_id"] = updatedUser.id;
        res.json(responseObject);
      }
    }
  );
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const result = await User.findById(req.params._id);
  let responseObject = result;


  if(req.query.from || req.query.to){
    let fromDate = new Date(0)
    let toDate = new Date()
    
    if(req.query.from){
      fromDate = new Date(req.query.from)
    }
    
    if(req.query.to){
      toDate = new Date(req.query.to)
    }
    
    result.log = result.log.filter((exerciseItem) =>{
      let exerciseItemDate = new Date(exerciseItem.date)
      
      return exerciseItemDate.getTime() >= fromDate.getTime()
        && exerciseItemDate.getTime() <= toDate.getTime()
    })
    
  }
  
  responseObject = responseObject.toJSON();

  responseObject["count"] = result.log.length;

  let new_list = responseObject.log.map(function (obj) {
    return {
      description: obj.description,
      duration: obj.duration,
      date: obj.date.toDateString(),
    };
  });

  res.json({
    username: responseObject.username,
    count: responseObject.count,
    _id: responseObject._id,
    log: new_list,
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
