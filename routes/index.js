var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const localStrategy = require("passport-local");
const passport = require('passport');
const upload = require('./multer');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: '586228372697-ndpoab9vc35gppe503pdikfs67uh382v.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Store user information in your database or session
    // Example: Save the user profile to MongoDB
    // User.findOneAndUpdate({ googleId: profile.id }, { $setOnInsert: { ...profile._json } }, { upsert: true, new: true }, (err, user) => done(err, user));

    return done(null, profile);
}));


passport.use(new localStrategy(userModel.authenticate()));
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/register', function(req, res){
  const { username, email, fullname} = req.body;
  if (!username || !email || !fullname) {
    // Redirect back to the home page or any desired page
    return res.redirect('/');
  }
  const userData = new userModel({username, email, fullname});

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res, function(){
      res.redirect("/profile");
    });
  })
  .catch(function(err){
    // Handle registration errors here
    console.error(err);
    // Redirect to an error page or handle it as needed
    res.redirect('/');
  });
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    // Successful authentication, redirect to the home page or any desired route
    res.redirect('/profile');
});


router.get('/login', function(req, res){
  res.render('login', {error: req.flash('error')});
});

router.post('/change-profile-photo/:userId', upload.single('dp'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const profilePhotoPath = req.file.filename;
    // console.log(profilePhotoPath);
    // Update user's profile photo in MongoDB
    const user = await userModel.findByIdAndUpdate(userId, { dp: profilePhotoPath });
   
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Please upload a photo then try to update');
    // res.render('/profile');
  }
});

router.get('/uperload', function(req, res){
  res.render('uperload');
});

router.get('/feed', async function(req, res){
  const post = await postModel.find();
  if(isLoggedIn){

    res.render('feed', {post: post, wow: "Visit your profile"});
  }
  
  res.render('feed', {post: post, wow: "Login Now"});
  // console.log(post);
});
// router.get('/feed/:userId', async function(req, res){
//   const post = await postModel.find();
//   const userId = req.params.userId;
//   const user = await userModel.findOne({_id: userId});
//   if(!user){
//      res.render('feed', {post: post});
//   }
//   // console.log(post);
//   res.render('feed', {post: post, user: user});
// });

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

router.get('/postDetails/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    // Retrieve the post details from the database based on postId
    const post = await postModel.findOne({_id: postId});

    if (!post) {
      return res.status(404).render('error', { message: 'Post not found' });
    }

    res.render('postDetails', { post });
  } catch (error) {
    console.error('Error retrieving post details:', error.message);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});

router.post('/delete-post/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    // Find the post by ID and remove it
    const deletedPost = await postModel.findOneAndDelete({
      _id: postId});

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await userModel.updateMany(
      { posts: postId },
      { $pull: { posts: postId } }
    );
    // Optionally, you can redirect to a different page or send a success message
    res.redirect('/profile'); // Replace with the appropriate URL
  } catch (error) {
    console.error('Error deleting post:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

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
