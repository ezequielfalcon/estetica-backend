var express = require('express');
var app = express();
var pg = require('pg');

app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/login', function (request, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query('SELECT * FROM comprobar_usuario("eze","1234")', function(err, result) {
            done();
            if (err)
            { console.error(err); response.send("Error " + err); }
            else
            { response.render('pages/db', {results: result.rows} ); }
        });
    });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
