
const mongoose=require('mongoose')
const postSchema = mongoose.Schema({
  username:{
     type: mongoose.Schema.Types.ObjectId,
     ref:"post"
  },
  title:String,
  discription:String,
  postimage:String
});
module.exports = mongoose.model("post",postSchema);
