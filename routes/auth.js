const router = require('express').Router();
const passport = require('passport');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');

// register
router.post('/register', async (req,res)=>{
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('missing');
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, hash });
    req.login(user, ()=> res.json({ _id:user._id, username }));
  } catch(e) {
    res.status(400).json({error:'username taken'});
  }
});

// login
router.post('/login', passport.authenticate('local'), (req,res)=>{
  res.json({ _id:req.user._id, username:req.user.username });
});

// logout
router.post('/logout', (req,res)=>{
  req.logout(()=> res.sendStatus(200));
});

// whoami
router.get('/me', (req,res)=> {
  res.json(req.user || null);
});

module.exports = router;