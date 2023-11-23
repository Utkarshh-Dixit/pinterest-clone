var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/createuser', async function(req, res, next){
  const createdUser = await userModel.create({
    username: "Utkarsh",
  password: "utkarsh",
  posts: [],
  email: "utkarshdixit.2k21@gmail.com",
  fullName: "Utkarsh Dixit"
});
res.send(createdUser);
});

router.get('/alluserposts', async function(req, res){
   let user = await userModel
   .findOne({_id: "655fa8c68fbf7c85eb2f29e2"})
   .populate('posts');
   res.send(user);
});

router.get('/createpost', async function(req, res){
  const createdPost = await postModel.create({
    postText: "Hello, i am another post",
    user: "655fa8c68fbf7c85eb2f29e2",
  });
  let user = await userModel.findOne({_id: "655fa8c68fbf7c85eb2f29e2"});
  user.posts.push(createdPost._id);
  await user.save();
  res.send("done");
});
module.exports = router;
