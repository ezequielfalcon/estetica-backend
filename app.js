var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser')

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.set('port', (process.env.PORT || 5000));

app.post('/login', function (request, response) {
    var usuario = request.body.usuario;
    var clave = request.body.clave;
    response.send(usuario);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
