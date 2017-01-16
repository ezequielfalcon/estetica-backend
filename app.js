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


app.post('/api/login', seguridad.login);

app.get('/api/usuarios', usuarios.usuarios);
app.post('api/usuarios', usuarios.nuevoUsuario);

app.get('/api', function (req, res) {
    res.json({mensaje: "Backend del sistema!!"})
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});