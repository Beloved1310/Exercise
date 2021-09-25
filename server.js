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
  userId: mongoose.Schema.Types.ObjectId,
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [exerciseSchema],
});

// userSchema.virtual('log', {
//   ref: 'Exercise', // The model to use
//   localField: '_id', // Find people where `localField`
//   foreignField: 'userId', // is equal to `foreignField`
//   // And only get the number of docs
// });

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
  let { description, duration, date } = req.body;
  date = date ? new Date(date).toDateString() : new Date().toDateString();
  
  const userObject =  await User.findById(req.params._id)

  const newExercise = await Exercise.create({
    userId: userObject._id,
    description,
    duration,
    date,
  });

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

  // res.send({
  //   username: userObject.username,
  //   description,
  //   duration,
  //   date,
  //   _id: userObject._id
  // })
});



app.get("/api/users/:_id/logs", async (req, res) => {

  const {from, to, limit} = req.query;

  const result = await User.findById(req.params._id);
  let responseObject = result;
  console.log(result)


  if(from || to || limit){
    let fromDate = new Date(0)
    let toDate = new Date()
    
    if(from){
      fromDate = new Date(from).toDateString()
    }
    
    if(to){
      toDate = new Date(to).toDateString()
    }
    
    result.log = result.log.filter((exerciseItem) =>{
      let exerciseItemDate = new Date(exerciseItem.date)
      
      return exerciseItemDate.getTime() >= fromDate.getTime()
        && exerciseItemDate.getTime() <= toDate.getTime()
    })

    if(limit){
      result.log = result.log.slice(0,limit);
    }
    
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





// app.get("/api/users/:_id/logs", async (req, res) => {
//   const bands = await User.findById(req.params._id).populate('log').exec((err, bands)=>{
//     res.send(bands)
//   })
  
    
    
   
  // let responseObject = result;

  // if (req.query.from || req.query.to) {
  //   let fromDate = new Date(0);
  //   let toDate = new Date();

  //   if (req.query.from) {
  //     fromDate = new Date(req.query.from);
  //   }

  //   if (req.query.to) {
  //     toDate = new Date(req.query.to);
  //   }

  //   result.log = result.log.filter((exerciseItem) => {
  //     let exerciseItemDate = new Date(exerciseItem.date);

  //     return (
  //       exerciseItemDate.getTime() >= fromDate.getTime() &&
  //       exerciseItemDate.getTime() <= toDate.getTime()
  //     );
  //   });
  // }

  // responseObject = responseObject.toJSON();

  // responseObject["count"] = result.log.length;

  // let new_list = responseObject.log.map(function (obj) {
  //   return {
  //     description: obj.description,
  //     duration: obj.duration,
  //     date: obj.date.toDateString(),
  //   };
  // });

  // res.json({
  //   username: responseObject.username,
  //   count: responseObject.count,
  //   _id: responseObject._id,
  //   log: new_list,
  // });
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
