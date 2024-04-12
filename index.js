const { Socket } = require('dgram');
const fs = require('fs');
const mongoose=require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/project");
const express=require('express');
const path=require('path');
const multer=require('multer');
const app=express();
const User=require('./models/usermodel');
const Post=require('./models/postmodel');
const body=require('body-parser');
const {v4: uuidv4}=require("uuid");
app.use(express.static(path.join(__dirname, 'public')));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public')
  },
  filename: function (req, file, cb) {
    const unique= uuidv4();
    cb(null,unique + path.extname(file.originalname));
  }
})
const upload=multer({storage:storage});
const session = require('express-session');
app.use(session({
    secret: 'your-secret-key', // Change this to a long random string
    resave: false,
    saveUninitialized: false
}));
app.use(body.json());
app.use(body.urlencoded({extended:true}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const http =require('http').Server(app);
var io =require('socket.io')(http);

http.listen('3000',function(req,res){
    console.log("server is live");
})

app.get('/chat',function(req,res){
   res.render('chat');
})
var users=[];
var roomno=0;
io.on('connection',function(socket){
    socket.on('set-user-name',function(data){
        // socket.on('disconnect',function(){
        //     socket.broadcast.emit('user-disconnect',{username:data});
        //     delete users[data];
        // })
        console.log(data+' user connected');
    if(users.indexOf(data)>-1){
        socket.emit('userexist',data +' username is already in use');
    }
    else{
        users.push(data);
        
        socket.emit('set-user',{username:data});
    }
    // socket.on('disconnect',function(data){
    //      io.sockets.emit('user-disconnect',{username:data});
    //      delete data;
    // })
     socket.on('message',function(data){
      socket.broadcast.emit('new-msg',{username:data.user,message:data.message});
       socket.emit('new-msg',{username:"you",message:data.message});
    })
     io.sockets.emit('user-connect',{username:data});//broadcast properly work nahi ker rha tha
    });
});


app.get('/', function(req,res){
         res.render('index');
});

app.get('/chalja',function(req,res){
  res.render('react');
})

app.get('/login',function(req,res){
    res.render('login');
})
app.get('/logout',function(req,res){
    req.session.destroy();
    res.redirect('/');
})
app.get('/show/posts/:userid',async function(req,res){
   const userId = req.params.userid;
  const userdata = await User.findById(userId);
  console.log(userdata);
  res.render("show",{user:userdata});
})
app.get('/edit',async function(req,res){
    const id=req.query.id;
    const userda= await User.findOne({_id:id});
    if(userda){
        res.render("edit",{user:userda});
    }
})
// app.get('/home',async function(req,res){
//      res.render("hello",{user:userdata});
// })
// app.get('/profile',async function(req,res){
//    const user = await User.findOne({id: req.session.user});
//   res.render("profile",{user});
// })
app.get('/add/:id',async function(req,res,next){
    const postId = req.params.id;
  const userdata = await User.findById(postId);
  
  res.render('add',{userdata});
})

// app.post('/edit',async function(req,res){
//     try {
//     await User.findByIdAndUpdate(req.body._id, {
//         $set: {
//             name: req.body.name,
//             email: req.body.email,
//             phone: req.body.mno
//         }
//     });
    
//      res.redirect('/home');
// } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
// }

// })
app.post('/createpost/:userid',upload.single("postimage"),async function(req,res,next){
  const userId = req.params.userid;
  const user = await User.findById(userId);

const post = await Post.create({
  user: user._id,
  title: req.body.title,
  discription: req.body.discription,
  postimage: req.file.filename
});
user.posts.push(post._id)
const userdata = await user.save();

res.render("profile",{userdata});
})
app.post('/register',upload.single('image'),async function(req,res){
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        // If email already exists, return a warning
        res.send("email is already register");
    }
        const user=User({
            name:req.body.name,
            email:req.body.email,
            mno:req.body.mno,
            image:req.file?.filename,
            password:req.body.password
        })
        console.log(30)
       const userdata= await user.save();
       if(userdata){
        console.log('user is register');
        res.render("profile",{userdata});
        // res.render('hello',{user:userd});
       }

})
app.post('/login',async function(req, res){
    try{
      const email = req.body.email;

      const password = req.body.password;
      const userdata = await User.findOne({ email: email });
    
      if (!userdata) {
        // User not found
        res.send("User not found");
        return;
    }

    // Log the entire userdata object for debugging

    // Compare passwords
    if (userdata.password === password) {
        // Passwords match, redirect to hello page
       res.render("profile",{userdata});
        // res.render('hello',{user:userdata});
    } else {
        // Passwords don't match
        res.send("Incorrect password");
    }
} catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
}
});