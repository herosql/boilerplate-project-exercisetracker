const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");

const { v4: uuidv4 } = require('uuid');

var users = new Map();

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

function generateId(){
  return uuidv4().replace(/-/g, "");
}

app.post('/api/users',function(req,res){
  let id = generateId();
  const user = {_id:id,username:req.body.username};
  users.set(id,user);
  res.json(user);
});

app.get('/api/users',function(req,res){
  res.json(Array.from(users.values()));
});

app.post('/api/users/:_id/exercises',(req,res)=>{
  const userId = req.params._id;
  let user  = users.get(userId);
  const date = req.body.date?new Date(req.body.date).toDateString():new Date().toDateString();
  const exercise = {description:req.body.description,
    duration: new Number(req.body.duration),
    date:date
  };
  if(user.log){
    user.log.push(exercise);
  }else{
    user.log = [];
    user.log.push(exercise);
  }
  user.count = user.log.length;
  res.json({_id:user._id,
    username:user.username,
    description:exercise.description,
    duration:exercise.duration,
    date:exercise.date
  });
});

function exercisesQuery(logs,query){
  let targetLogs = [];
  if(query.from && query.to){
    targetLogs = logs.filter((exercise)=>{
      if(compareTime(exercise.date,query.from) && compareTime(query.to,exercise.date)){
        return true;
      }
      return false;
    });
  }else{
    targetLogs = logs;
  }
 
  if(targetLogs.length > query.limit){
    targetLogs = targetLogs.slice(0, query.limit);
  }
  return targetLogs;
}

function compareTime(oldDate, newDate) {
  if (typeof oldDate === "string") {
    oldDate = new Date(oldDate);
  }
  if (typeof newDate === "string") {
    newDate = new Date(newDate);
  }

  return oldDate.getTime() >= newDate.getTime();
}

app.get('/api/users/:_id/logs',(req,res)=>{
  const userId = req.params._id;
  let user  = users.get(userId);
  let query = req.query;
  let logs = user.log
  if(query.limit){
    logs = exercisesQuery(logs,query);
  }
  let tempLogs = user.log;
  user.log = logs;
  res.json(user);
  user.log = tempLogs;
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
