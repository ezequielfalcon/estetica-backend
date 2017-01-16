var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var pgp = require("pg-promise")();
var db = pgp(process.env.DATABASE_URL);

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));


var seguridad = require('./server/seguridad.js')(db);
var usuarios = require('./server/usuarios.js')(db);


app.post('/login', seguridad.login);

app.get('/usuarios', usuarios.usuarios);

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});