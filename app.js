var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var jwt    = require('jsonwebtoken');

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));


app.set('port', (process.env.PORT || 5000));

app.post('/login', function (req, res) {


});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});