const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');



mongoose.connect("mongodb://127.0.0.1:27017/pinterestclone");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
  }],
  dp: {
    type: String, // You may adjust the type based on your requirements (e.g., URL, Buffer for image data, etc.).
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  fullname: {
    type: String,
    // required: true,
  },
});

userSchema.plugin(plm);
module.exports = mongoose.model('User', userSchema);

