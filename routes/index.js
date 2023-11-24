var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const localStrategy = require("passport-local");
const passport = require('passport');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/register', function(req, res){
  const { username, email, fullname} = req.body;
  const userData = new userModel({username, email, fullname});

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    })
  })
});

router.get('/login', function(req, res){
  res.render('login', {error: req.flash('error')});
});

router.get('/feed', function(req, res){
  res.render('feed');
});

router.post('/upload', isLoggedIn, upload.single('file'), async function(req, res){
  if(!req.file) return res.status(404).send("No files were uploaded");
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    image: req.file.filename,
    postText: req.body.filecaption,
    user: user._id
  });
   user.posts.push(post._id);
   await user.save(); 
  res.redirect("/profile");
});

router.get('/profile', isLoggedIn, async function(req, res){
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts");

  res.render('profile', {user});
})

router.post('/login', passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res){});

router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

// router.get('/createuser', async function(req, res, next){
//   const createdUser = await userModel.create({
//     username: "Utkarsh",
//   password: "utkarsh",
//   posts: [],
//   email: "utkarshdixit.2k21@gmail.com",
//   fullName: "Utkarsh Dixit"
// });
// res.send(createdUser);
// });

// router.get('/alluserposts', async function(req, res){
//    let user = await userModel
//    .findOne({_id: "655fa8c68fbf7c85eb2f29e2"})
//    .populate('posts');
//    res.send(user);
// });

// router.get('/createpost', async function(req, res){
//   const createdPost = await postModel.create({
//     postText: "Hello, i am another post",
//     user: "655fa8c68fbf7c85eb2f29e2",
//   });
//   let user = await userModel.findOne({_id: "655fa8c68fbf7c85eb2f29e2"});
//   user.posts.push(createdPost._id);
//   await user.save();
//   res.send("done");
// });
module.exports = router;
