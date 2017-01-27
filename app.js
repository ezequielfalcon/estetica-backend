var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pgp = require("pg-promise")();
var db = pgp(process.env.DATABASE_URL);
var seguridad = require('./server/seguridad.js')(db);
var usuarios = require('./server/usuarios.js')(db, pgp);
var obras_sociales = require('./server/obras_sociales')(db, pgp);
var roles = require('./server/roles.js')(db, pgp);
var pacientes = require('./server/pacientes')(db, pgp);


app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));


//login
app.post('/api/login', seguridad.login);


//usuarios
app.get('/api/usuarios', usuarios.usuarios);
app.get('/api/usuarios/:id', usuarios.usuario);
app.post('/api/usuarios', usuarios.crear);
app.delete('/api/usuarios/:id', usuarios.borrarUsuario);
app.put('/api/usuarios/:id', usuarios.modificarUsuario);

//roles
app.get('/api/roles', roles.traer);
app.get('/api/roles/:id', roles.traer);
app.post('/api/roles', roles.crear);
app.delete('/api/roles/:id', roles.borrar);
app.put('/api/roles/:id', roles.modificar);

//obras sociales
app.get('/api/obras_sociales', obras_sociales.traer);
app.get('/api/obras_sociales/:id', obras_sociales.traer);
app.post('/api/obras_sociales', obras_sociales.crear);
app.put('/api/obras_sociales/:id', obras_sociales.modificar);
app.delete('/api/obras_sociales/:id', obras_sociales.borrar);

//pacientes
app.get('/api/pacientes', pacientes.traer);
app.get('/api/pacientes/:id/:dni');
app.post('/api/pacientes');
app.put('/api/pacientes/:id');
app.delete('/api/pacientes/:id');

app.get('/api', function (req, res) {
    res.json({mensaje: "Backend del sistema!!"})
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});