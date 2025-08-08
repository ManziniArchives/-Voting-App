require('dotenv').config();
const express       = require('express');
const mongoose      = require('mongoose');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcryptjs');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');
const cors          = require('cors');

const app = express();

// ---------- DB ----------
mongoose.connect(process.env.MONGO_URI);

// ---------- MIDDLEWARE ----------
app.use(cors({ origin:true, credentials:true }));
app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave:false,
  saveUninitialized:false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));
app.use(passport.initialize());
app.use(passport.session());

// ---------- Passport config ----------
const User = require('./models/User');
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null,false);
      const match = await bcrypt.compare(password, user.hash);
      return done(null, match ? user : false);
    } catch (e) { done(e); }
  }
));
passport.serializeUser((u,d)=>d(null,u._id));
passport.deserializeUser(async (id,d)=> d(null, await User.findById(id)));

// ---------- ROUTES ----------
app.use('/auth', require('./routes/auth'));
app.use('/api/polls', require('./routes/polls'));

// ---------- SPA ----------
app.get('*', (_,res)=> res.sendFile(__dirname+'/public/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log('Server on', PORT));