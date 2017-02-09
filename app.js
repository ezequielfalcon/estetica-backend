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
var medicos = require('./server/medicos')(db, pgp);
var consultorios = require('./server/consultorios')(db, pgp);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.header("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
    next();
});

//asd

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 5000));


//seguridad
app.post('/api/login', seguridad.login);
app.post('/api/cambiar-clave');


//usuarios
app.get('/api/usuarios', usuarios.usuarios);
app.get('/api/usuarios/:id', usuarios.usuario);
app.post('/api/usuarios', usuarios.crear);
app.delete('/api/usuarios/:id', usuarios.borrarUsuario);
app.put('/api/usuarios/:id', usuarios.modificarUsuario);
app.post('/api/usuario/clave', usuarios.cambiarClave);

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
app.get('/api/pacientes/:id', pacientes.traer);
app.post('/api/pacientes', pacientes.crear);
app.put('/api/pacientes/:id', pacientes.modificar);
app.delete('/api/pacientes/:id', pacientes.borrar);

//medicos
app.get('/api/medicos', medicos.traer);
app.get('/api/medicos/:id', medicos.traer);
app.post('/api/medicos', medicos.crear);
app.put('/api/medicos/:id', medicos.modificar);
app.delete('/api/medicos/:id', medicos.borrar);

//consultorios
app.get('/api/consultorios', consultorios.traer);
app.get('/api/consultorios/:id', consultorios.traer);
app.post('/api/consultorios', consultorios.crear);
app.put('/api/consultorios/:id', consultorios.modificar);
app.delete('/api/consultorios/:id', consultorios.borrar);

app.get('/api', function (req, res) {
    res.json({mensaje: "Backend del sistema!!"})
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});