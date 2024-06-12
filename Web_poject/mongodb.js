const { compile } = require("ejs");
const mongoose=require("mongoose")
mongoose.connect('mongodb://localhost:27017/web_mult')

.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true,
        minlength: 8
    }
})
const TaskSchema = new mongoose.Schema({
    username:{
      type:String,
      required:true
    }, 
    date: {
      type: Date,
      required: true, 
    },
    taskId: {
      type: String, 
      required: true,
    },
    result: {
      type: Buffer, // для збереження бінарних даних
      required: false,
    },
    percentege_of_compile: {
      type: Number, 
      required: true,
    },
    topicality: {
      type: String, 
      required: true,
    },

  })
      
const User = new mongoose.model('users_collection',UserSchema)
const Task = new mongoose.model('tasks_collection',TaskSchema)

module.exports = {
  User,
  Task,
};