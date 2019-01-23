const express = require('express')
var path = require('path');

const app = express();

// This is a middleware for serving files from the 'public' dir
app.use(express.static(path.join(__dirname, 'public')));

// Find views in the views folder. Use HTML to render
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', (req, res) => {
  return res.render('index');
});

app.listen(8000, () => {
  console.log('Example app listening on port 8000!')
});