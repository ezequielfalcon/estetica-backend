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
var turnos = require('./server/turnos')(db, pgp);
var tratamientos = require('./server/tratamientos')(db, pgp);
var ctacte = require('./server/cuenta_corriente')(db, pgp);
var medicosSub = require('./server/medico-sub')(db, pgp);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.header("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
    next();
});

//asd

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
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
app.post('/api/buscar-pacientes', pacientes.buscar);

//medicos
app.get('/api/medicos', medicos.traer);
app.get('/api/medicos/:id', medicos.traer);
app.post('/api/medicos', medicos.crear);
app.put('/api/medicos/:id', medicos.modificar);
app.delete('/api/medicos/:id', medicos.borrar);

//anulaciones
app.post('/api/anulaciones', medicos.nuevaAnulacion);
app.get('/api/anulaciones/:fecha', medicos.verAnulaciones);
app.get('/api/anulaciones', medicos.verAnulaciones);
app.delete('/api/anulaciones/:id', medicos.borrarAnulacion);

//consultorios
app.get('/api/consultorios', consultorios.traer);
app.get('/api/consultorios/:id', consultorios.traer);
app.post('/api/consultorios', consultorios.crear);
app.put('/api/consultorios/:id', consultorios.modificar);
app.delete('/api/consultorios/:id', consultorios.borrar);

//tratamientos
app.get('/api/tratamientos', tratamientos.traer);
app.get('/api/tratamientos/:id', tratamientos.traer);
app.get('/api/tratamientos-agenda/:id', tratamientos.traerAgenda);
app.post('/api/tratamientos', tratamientos.crear);
app.put('/api/tratamientos/:id', tratamientos.modificar);
app.delete('/api/tratamientos/:id', tratamientos.borrar);

//turnos
app.get('/api/configuracion-turnos', turnos.verConfiguracion);
app.get('/api/turnos/:fecha/:consultorio/:turno/:entreturno', turnos.verTurnos);
app.get('/api/turnos/:fecha/:medico', turnos.verTurnos);
app.get('/api/turnos/:fecha', turnos.verTurnos);
app.get('/api/turno/:id', turnos.turnoPorId);
app.get('/api/horarios', turnos.verHorarios);
app.delete('/api/turnos/:id', turnos.borrarTurno);
app.get('/api/agenda/:fecha', turnos.agendaResumen);
app.post('/api/nuevo-turno', turnos.crearTurno);
app.post('/api/agregar-tratamiento', turnos.nuevoTratamientoTurno);
app.post('/api/turno-presente', turnos.agendaPresente);
app.put('/api/agenda/modificar-costo/:id', turnos.modificarCosto);

//cuenta corriente
app.get('/api/cuenta-corriente/:id', ctacte.consultar);
app.post('/api/cuenta-corriente', ctacte.insertar);
app.get('/api/cuenta-corriente', ctacte.consultar);

//subsistema medicos
app.get('/api/sub-medicos/turnos/:fecha', medicosSub.turnos);
app.put('/api/sub-medicos/turnos/:id', medicosSub.atendido);

var reportingApp = express();
app.use('/reportes', reportingApp);

app.get('/api', function(req, res) {
    res.json({
        mensaje: "Backend del sistema!!"
    })
});

var server = app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});

var jsreport = require('jsreport')({
    express: { app :reportingApp, server: server },
    appPath: "/reportes"
});

jsreport.init().catch(function (e) {
    console.error(e);
});
