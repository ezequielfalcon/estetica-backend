var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require("pg-promise")();


app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));

var db = pgp(process.env.DATABASE_URL);

var seguridad = require('./server/seguridad.js')(db);
var usuarios = require('./server/usuarios.js')(db, pgp);


app.post('/api/login', seguridad.login);

app.get('/api/usuarios', usuarios.usuarios);
app.post('/api/usuarios', usuarios.nuevoUsuario);
app.delete('/api/usuarios/:id', usuarios.borrarUsuario);
app.put('/api/usuarios/:id', usuarios.modificarUsuario);

app.get('/api', function (req, res) {
    res.json({mensaje: "Backend del sistema!!"})
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});