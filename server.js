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
  "mongodb+srv://aydemo:aydemo@cluster0.szk1g.mongodb.net/microservices",
  { useNewUrlParser: true },
  { useUnifiedTopology: true }
);

const exerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date,
});
const personSchema = new Schema({
  username: { type: String, required: true },
  count: Number,
  log: [exerciseSchema],
});

const Exercise = mongoose.model("Exercise", exerciseSchema);
const Person = mongoose.model("Person", personSchema);

app.use(cors());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", (req, res) => {
  Person.find({}, (err, data) => {
    if (!data) {
      res.send("No users");
    } else {
      res.json(data);
    }
  });
});

app.post("/api/users", (req, res) => {
  const newPerson = new Person({ username: req.body.username });
  newPerson.save((err, data) => {
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
    newExercise.date = newExercise.date.toDateString
    console.log(newExercise.date)
  }

  if (newExercise.date === "") {
    newExercise.date = new Date().toISOString().substring(0, 10);
  }

  Person.findByIdAndUpdate(
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



app.get("/api/users/:_id/logs",  (req, res) => {
 Person.findById(req.params._id, (error, result) =>{
   if(!error){
    
      let responseObject = result
      responseObject = responseObject.toJSON()
    
      responseObject['count'] = result.log.length

      
    

      let new_list = responseObject.log.map(function(obj) {
        return {
          description: obj.description,
          duration: obj.duration,
          date: obj.date.toDateString()
        }
      });
      
      res.json({_id: responseObject._id,username: responseObject.username, count: responseObject.count,
         log: new_list})
      

   }
 })
});

// app.get('/api/users/:_id/logs', (request, response) => {
//   Person.findById(request.params._id, (error, result) => {
//     if(!error){

      
// /* Count Limit */
// if(request.query.limit){
//   result.log = result.log.slice(0, request.query.limit)
// }

// /*Date Filter */
// if(request.query.from || request.query.to){
//   let fromDate = new Date(0)
//   let toDate = new Date()
  
//   if(request.query.from){
//     fromDate = new Date(request.query.from)
//   }
  
//   if(request.query.to){
//     toDate = new Date(request.query.to)
//   }
  
//   result.log = result.log.filter((exerciseItem) =>{
//     let exerciseItemDate = new Date(exerciseItem.date)
    
//     return exerciseItemDate.getTime() >= fromDate.getTime()
//       && exerciseItemDate.getTime() <= toDate.getTime()
//   })
  
// }

// responseObject = responseObject.toJSON()
// responseObject['count'] = result.log.length
// response.json(result)

		
//     }
//   })
// })


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
