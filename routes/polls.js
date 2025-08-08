const router = require('express').Router();
const Poll = require('../models/Poll');
const ensureAuth = (req,res,next)=> req.isAuthenticated()? next(): res.sendStatus(401);

// list all
router.get('/', async (_,res)=> {
  res.json(await Poll.find().populate('author','username'));
});

// single poll
router.get('/:id', async (req,res)=>{
  res.json(await Poll.findById(req.params.id).populate('author','username'));
});

// create (auth)
router.post('/', ensureAuth, async (req,res)=>{
  const { title, options } = req.body;   // options = array of strings
  const poll = await Poll.create({
    title,
    options: options.map(o=>({ text:o })),
    author: req.user._id
  });
  res.json(poll);
});

// add option (auth)
router.post('/:id/options', ensureAuth, async (req,res)=>{
  const { text } = req.body;
  const poll = await Poll.findById(req.params.id);
  poll.options.push({ text, votes:0 });
  await poll.save();
  res.json(poll);
});

// vote (public)
router.post('/:id/vote', async (req,res)=>{
  const { optionId } = req.body;
  const poll = await Poll.findById(req.params.id);
  const opt  = poll.options.id(optionId);
  opt.votes += 1;
  await poll.save();
  res.json(poll);
});

// delete (only owner)
router.delete('/:id', ensureAuth, async (req,res)=>{
  const poll = await Poll.findById(req.params.id);
  if (!poll.author.equals(req.user._id)) return res.sendStatus(403);
  await poll.deleteOne();
  res.sendStatus(204);
});

module.exports = router;