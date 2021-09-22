const express = require('express')
const app = express()


const cors = require('cors')
require('dotenv').config()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const mongoose = require('mongoose');
const {Schema} = mongoose;
mongoose.connect('mongodb+srv://aydemo:aydemo@cluster0.szk1g.mongodb.net/microservices', {useNewUrlParser: true  }, { useUnifiedTopology: true })

// const personSchema = new Schema ({username: {type:String, unique:true}, exercise: [{ type: Schema.Types.ObjectId, ref: 'Exercise'}]
//    });

   const personSchema = new Schema ({username: String 
   });
const Person = mongoose.model('Person', personSchema)

const exerciseSchema = new Schema ({ description: String, duration: Number, date: Date})

const Exercise = mongoose.model("Exercise", exerciseSchema)
app.use(cors())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req,res)=>{
  Person.find({},(err,data)=>{
    if(!data){
      res.send("No users")
    }else{
      res.json(data)
    }
  })
})

app.post("/api/users", (req,res)=>{
const newPerson = new Person({username: req.body.username});
newPerson.save((err, data) => {
  if(err){
    res.json("username taken")
  }else {
  res.json({"username": data.username, "_id": data.id})
  }
})
})

// app.post("/api/users/:_id/exercises", (req,res) => {
//   const { _id, description, duration, date}= req.body;
 
//   Person.findById(_id, (err, data) =>{
//     console.log(data)
//     if(!data){
//      return res.json("unknown userId")
//     }
//       const username = data.username
      
   
//     let newExercise = new Exercise ({ _id, description, duration, date})
//     newExercise.save((err, data)=>{
//       return res.json({ _id, username, date: new Date(date).toDateString(), duration: +duration, description})
//     })
//   })
// })


app.post("/api/users/:_id/exercises", async (req, res) => {
  
  const { description, duration, date}= req.body;
  
  const findUser = await Person.findById({_id: req.params._id})

  // console.log(findUser)
  const username = findUser.username
  console.log(username)
  // Person.findById(_id, (err, datao) =>{
        
  //       if(!data){
  //        return res.json("unknown userId")
  //       }
  //         const username = data.username
  
  const data = await Exercise.create({
     description, duration, date
  })

  

  // {
  //   username: "fcc_test"
  //   description: "test",
  //   duration: 60,
  //   date: "Mon Jan 01 1990",
  //   _id: "5fb5853f734231456ccb3b05"
  // }
  // const u = await Person.findById({ _id: req.params._id}).populate('exercise')
  // console.log(u)
  // const newData = await Exercise.findOne({userId : req.params._id})
  // console.log(newData)
  
  return res.send({username, description: data.description, duration: data.duration, date: data.date,  _id:findUser._id  })
})




app.get("/api/users/:_id/logs", (req,res)=> {
   
  const {_id }= req.params
  const { from, to, limit } = req.query

   Person.findById( _id , (err, data) => {
     if(!data){
       res.send("Unknown userId")
     }else{
       const username = data.username
       console.log({"from": from, "to":to, "limit": limit});
       Exercise.find({_id}, { date: { $gte: new Date(from), $lte: new Date(to) } })
           .select(["id", "description", "duration", "date"]).limit(+limit)

       .exec((err, data) =>{
         let customdata = data.map(exer =>{
           let dateFormatted = new Date(exer.date).toDateString();
           return {id: exer.id, description: exer.description, duration: exer.duration, date: dateFormatted}
         })
         if(!data){
           res.json({
             "_id": _id,
             "username": username,
             "count": 0,
             "log": []
           })
         } else{
           res.json({
             "_id": _id,
             "username": username,
             "count": data.length,
             "log": customdata 
           })
         }
       })
     }
   })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
