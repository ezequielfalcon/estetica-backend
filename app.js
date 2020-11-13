let express = require('express');
let app = express();
let bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const pgp = require("pg-promise")();

const cn = {
    host: 'localhost',
    port: 5432,
    database: 'estetica',
    user: 'falco',
    password: '1234'
};

const db = pgp(process.env.DATABASE_URL || cn);

const seguridad = require('./server/seguridad.js')(db);
const usuarios = require('./server/usuarios.js')(db, pgp);
const obras_sociales = require('./server/obras_sociales')(db, pgp);
const roles = require('./server/roles.js')(db, pgp);
const pacientes = require('./server/pacientes')(db, pgp);
const medicos = require('./server/medicos')(db, pgp);
const consultorios = require('./server/consultorios')(db, pgp);
const turnos = require('./server/turnos')(db, pgp);
const tratamientos = require('./server/tratamientos')(db, pgp);
const ctacte = require('./server/cuenta_corriente')(db, pgp);
const medicosSub = require('./server/medico-sub')(db, pgp);

const reportingApp = express();
app.use('/reportes', reportingApp);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    res.header("Access-Control-Allow-Methods", "POST, PUT, DELETE, GET, OPTIONS");
    next();
});

app.use(bodyParser.json({'type': '*/*', limit: '20mb'}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(fileUpload());
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
app.get('/api/tratamientos-busqueda/:fechaOld/:fechaNew', tratamientos.tratamientosBusqueda);

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
//nueva query para listados
app.get('/api/listado-turnos/:fecha/:medico', turnos.verTurnosListadoNew);
//turnos por paciente
app.get('/api/turnos-paciente/:paciente', turnos.turnosPorPaciente);
//listado para medicos
app.get('/api/turnos-medico/:medico/:fechaOld/:fechaNew', turnos.turnosPorMedicoResumen);

//cuenta corriente
app.get('/api/cuenta-corriente/:id', ctacte.consultar);
app.post('/api/cuenta-corriente', ctacte.insertar);
app.get('/api/cuenta-corriente', ctacte.consultar);

//subsistema medicos
app.get('/api/sub-medicos/turnos/:fecha', medicosSub.turnos);
app.put('/api/sub-medicos/turnos/:id', medicosSub.atendido);

//historia
app.get('/api/historia/:id_agenda', turnos.verHistoria);
app.post('/api/historia', turnos.cargarHistoria);
app.get('/api/fotos/:id', turnos.verFoto);
app.put('/api/fotos/:id', turnos.cargarFoto);

app.get('/api', function(req, res) {
    res.json({
        mensaje: "Backend del sistema!!"
    })
});

const server = app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});

// const jsreport = require('jsreport')({
//     express: { app: reportingApp, server: server },
//     appPath: "/reportes",
//     connectionString: {
//         name: "mongodb",
//         uri: process.env.MONGODB_URI
//     },
//     blobStorage: {provider: "gridFS"},
//     authentication: {
//         cookieSession: {
//             "secret": "dasd321as56d1sd5s61vdv32"
//         },
//         admin: {
//             "username": "admin",
//             "password": process.env.JSREPORT_PASS
//         }
//     }
// });
// jsreport.use(require('jsreport-authentication')({}));

// jsreport.init().catch(function(e) {
//     console.error(e);
// });
