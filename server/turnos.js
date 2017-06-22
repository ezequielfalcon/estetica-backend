/**
 * Created by eze on 11/02/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp) {
    var module = {};
    var qrm = pgp.queryResult;

    module.verConfiguracion = verConfiguracion;
    module.verTurnos = verTurnos;
    module.crearTurno = crearTurno;
    module.nuevoTratamientoTurno = nuevoTratamientoTurno;
    module.agendaResumen = verAgendaResumen;
    module.agendaPresente = agendaPresente;
    module.borrarTurno = borrarTurno;
    module.verHorarios = verHorarios;
    module.modificarCosto = modificarCosto;
    module.turnoPorId = verTurnoPorId;
    module.verTurnosListado = verTurnosListados;
    module.turnosPorPaciente = turnosPorPaciente;
    module.verTurnosListadoNew = verTurnosListadoNew;

    function verTurnosListadoNew(req, res) {
        let token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.fecha && req.params.medico){
                        db.manyOrNone("select DISTINCT ON (agenda.id_paciente) id_paciente, CONCAT(pacientes.apellido, ' ', pacientes.nombre) paciente " +
                            "from agenda " +
                            "inner join pacientes on agenda.id_paciente = pacientes.id " +
                            "where fecha = $1 and id_medico = $2;"
                        ,[req.params.fecha, req.params.medico])
                            .then(pacientes => {
                                if (pacientes) {
                                    let resultadoPacientes = [];
                                    let pacientesListos = 0;
                                    for (let paciente of pacientes) {
                                        let nuevoTurno = {};
                                        nuevoTurno.id_paciente = paciente.id_paciente;
                                        nuevoTurno.paciente = paciente.paciente;
                                        db.one('SELECT * FROM agenda WHERE id_paciente = $1 AND agenda.fecha = $2 AND agenda.id_medico = $3 ORDER BY id_turno ASC, entreturno ASC LIMIT 1;'
                                        ,[paciente.id_paciente, req.params.fecha, req.params.medico])
                                            .then(turno => {
                                                nuevoTurno.id = turno.id;
                                                nuevoTurno.telefono = turno.telefono;
                                                nuevoTurno.id_consultorio = turno.id_consultorio;
                                                nuevoTurno.id_turno = turno.id_turno;
                                                nuevoTurno.entreturno = turno.entreturno;
                                                nuevoTurno.presente = turno.presente;
                                                nuevoTurno.atendido = turno.atendido;
                                                nuevoTurno.hora_llegada = turno.hora_llegada;
                                                nuevoTurno.costo = turno.costo;
                                                nuevoTurno.costo2 = turno.costo2;
                                                nuevoTurno.costo3 = turno.costo3;
                                                nuevoTurno.usuario = turno.usuario;
                                                pacientesListos++;
                                                resultadoPacientes.push(nuevoTurno);
                                                if (pacientesListos === pacientes.length) {
                                                    resultadoPacientes.sort(ordenarTurnos);
                                                    res.json({resultado: true, datos: resultadoPacientes})
                                                }
                                            })
                                            .catch(function(err){
                                                console.log(err);
                                                res.status(500).json({resultado: false, mensaje: err})
                                            })
                                    }
                                }
                                else {
                                    res.json({resultado: true, datos:{}})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else if (req.params.fecha) {
                        db.manyOrNone("select DISTINCT ON (agenda.id_paciente) id_paciente, CONCAT(pacientes.apellido, ' ', pacientes.nombre) paciente " +
                            "from agenda " +
                            "inner join pacientes on agenda.id_paciente = pacientes.id " +
                            "where fecha = $1;"
                            ,[req.params.fecha])
                            .then(pacientes => {
                                if (pacientes) {
                                    let resultadoPacientes = [];
                                    let pacientesListos = 0;
                                    for (let paciente of pacientes) {
                                        let nuevoTurno = {};
                                        nuevoTurno.id_paciente = paciente.id_paciente;
                                        nuevoTurno.paciente = paciente.paciente;
                                        db.one('SELECT * FROM agenda WHERE id_paciente = $1 AND agenda.fecha = $2 ORDER BY id_turno ASC, entreturno ASC LIMIT 1;'
                                            ,[paciente.id_paciente, req.params.fecha])
                                            .then(turno => {
                                                nuevoTurno.id = turno.id;
                                                nuevoTurno.telefono = turno.telefono;
                                                nuevoTurno.id_consultorio = turno.id_consultorio;
                                                nuevoTurno.id_turno = turno.id_turno;
                                                nuevoTurno.entreturno = turno.entreturno;
                                                nuevoTurno.presente = turno.presente;
                                                nuevoTurno.atendido = turno.atendido;
                                                nuevoTurno.hora_llegada = turno.hora_llegada;
                                                nuevoTurno.costo = turno.costo;
                                                nuevoTurno.costo2 = turno.costo2;
                                                nuevoTurno.costo3 = turno.costo3;
                                                nuevoTurno.usuario = turno.usuario;
                                                nuevoTurno.id_medico = turno.id_medico;
                                                pacientesListos++;
                                                resultadoPacientes.push(nuevoTurno);
                                                if (pacientesListos === pacientes.length) {
                                                    resultadoPacientes.sort(ordenarTurnos);
                                                    res.json({resultado: true, datos: resultadoPacientes})
                                                }
                                            })
                                            .catch(function(err){
                                                console.log(err);
                                                res.status(500).json({resultado: false, mensaje: err})
                                            })
                                    }
                                }
                                else {
                                    res.json({resultado: true, datos:{}})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else {
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan parámetros para ver los turnos"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function ordenarTurnos(a, b) {
        if (a.id_turno < b.id_turno) {
            return -1;
        }
        if (a.id_turno > b.id_turno) {
            return 1;
        }
        return 0;
    }

    function turnosPorPaciente(req, res) {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.paciente) {
                        //TODO
                        res.status(500).json({resultado: false, mensaje: "No implementado"})
                    }
                    else{
                        res.status(400).json({resultado: false, mensaje: "Debe especificar un ID de paciente"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function modificarCosto(req,res) {
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol === 'admin' || decoded.rol === 'usuario'){
                        if (req.params.id && req.body.costo && req.body.costo2 && req.body.costo3){
                            db.none("UPDATE agenda SET costo = $1, costo2 = $2, costo3 = $3 WHERE id = $4;",
                                [req.body.costo, req.body.costo2, req.body.costo3 ,req.params.id], qrm.one)
                                .then(function(){
                                    res.json({resultado: true, mensaje: "Costo modificado!"})
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Agenda sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para modificar el costo"})
                        }
                    }
                    else{
                        res.status(403).json({resultado: false, mensaje: "No tiene permiso para modificar el costo"});
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verHorarios(req, res){
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    db.manyOrNone("select * from turnos order by id;",
                        req.params.fecha)
                        .then(function(data) {
                            res.json({resultado: true, datos: data});
                        })
                        .catch(function(error) {
                            console.log(error);
                            res.status(500).json({
                                resultado: false,
                                mensaje: "Error interno: " + error
                            });
                        })
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function borrarTurno(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol === 'admin' || decoded.rol === 'usuario'){
                        if (req.params.id){
                            db.func("agenda_borrar_turno", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.agenda_borrar_turno === 'error-agenda'){
                                        res.status(400).json({resultado: false, mensaje: "No se encuentra el turno especificado"})
                                    }
                                    else if (data.agenda_borrar_turno === 'error-presente') {
                                        res.status(400).json({resultado: false, mensaje: "No puede borrar un turno al que un paciente asistió!"})
                                    }
                                    else if (data.agenda_borrar_turno === 'ok') {
                                        res.json({resultado: true, mensaje: "Turno borrado correctamente!"})
                                    }
                                    else{
                                        res.status(500).json({resultado: false, mensaje: "Error interno: " + data.agenda_borrar_turno});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Agenda sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para agregar el tratamiento al turno especificado"})
                        }
                    }
                    else{
                        res.status(403).json({resultado: false, mensaje: "No tiene permiso para borrar un Turno"});
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function agendaPresente(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (req.body.id_agenda && req.body.presente){
                        db.func("agenda_presente", [req.body.id_agenda, req.body.presente], qrm.one)
                            .then(function(data){
                                if (data.agenda_presente == 'error-agenda'){
                                    res.status(400).json({resultado: false, mensaje: "Error: No se encuentra el turno cargado"})
                                }
                                else if (data.agenda_presente == 'error-atendido'){
                                    res.status(400).json({resultado: false, mensaje: "Paciente ya atendido por el Médico!"});
                                }
                                else if (data.agenda_presente == 'ok') {
                                    res.json({resultado: true, mensaje: "Asistencia confirmada!"})
                                }
                                else{
                                    res.status(500).json({resultado: false, mensaje: "Error interno: " + data.agenda_presente});
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan datos para configurar la presencia del paciente."})
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function nuevoTratamientoTurno(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (req.body.id_agenda && req.body.id_tratamiento){
                        db.func("agenda_turno_tratamiento", [req.body.id_agenda, req.body.id_tratamiento], qrm.one)
                            .then(function(data){
                                if (data.agenda_turno_tratamiento == 'error-agenda'){
                                    res.status(400).json({resultado: false, mensaje: "Error al asignar tratamiento: No se encuentra el turno cargado"})
                                }
                                else if (data.agenda_turno_tratamiento == 'error-tratamiento') {
                                    res.status(400).json({resultado: false, mensaje: "Error al asignar tratamiento: No se encuentra el tratamiento!"})
                                }
                                else if (data.agenda_turno_tratamiento == 'error-existe') {
                                    res.status(400).json({resultado: false, mensaje: "Error al asignar tratamiento: ya está asignado"})
                                }
                                else if (data.agenda_turno_tratamiento == 'ok') {
                                    res.json({resultado: true, mensaje: "Tratamiento agregado correctamente!"})
                                }
                                else{
                                    res.status(500).json({resultado: false, mensaje: "Error interno: " + data.agenda_turno_tratamiento});
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan datos para agregar el tratamiento al turno especificado"})
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function crearTurno(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (req.body.id_turno && req.body.id_paciente && req.body.id_consultorio && req.body.id_medico
                        && req.body.observaciones
                        && req.body.costo && req.body.fecha && req.body.entreturno){
                        db.func("agenda_nuevo_turno", [req.body.id_turno, req.body.id_paciente
                           , req.body.id_consultorio, req.body.id_medico
                           , decoded.nombre, req.body.observaciones
                           , req.body.costo, req.body.fecha, req.body.entreturno], qrm.one)
                            .then(function(data){
                                if (data.agenda_nuevo_turno == 'error-turno'){
                                    res.status(400).json({resultado: false, mensaje: "No se encuentra el horario de turno"})
                                }
                                else if (data.agenda_nuevo_turno == 'error-paciente') {
                                    res.status(400).json({resultado: false, mensaje: "No se encuentra el paciente"})
                                }
                                else if (data.agenda_nuevo_turno == 'error-consultorio') {
                                    res.status(400).json({resultado: false, mensaje: "No se encuentra el consultorio"})
                                }
                                else if (data.agenda_nuevo_turno == 'error-medico') {
                                    res.status(400).json({resultado: false, mensaje: "No se encuentra el médico"})
                                }
                                else if (data.agenda_nuevo_turno == 'error-agenda') {
                                    res.status(400).json({resultado: false, mensaje: "Ya existe un turno en ese horario y consultorio!"})
                                }
                                else if (data.agenda_nuevo_turno === 'error-ausente') {
                                    res.status(400).json({resultado: false, mensaje: "Médico ausente!"})
                                }
                                else {
                                    res.json({resultado: true, mensaje: "Turno creado con ID: " + data.agenda_nuevo_turno, id: data.agenda_nuevo_turno})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan datos para crear el Turno en la agenda"})
                    }
                }
            });
        }
        else{
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verTurnosListados(req, res) {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.fecha && req.params.medico){
                        db.manyOrNone("SELECT DISTINCT ON(agenda.id_paciente) agenda.id_paciente ,agenda.id, " +
                            "CONCAT(pacientes.apellido, ' ', pacientes.nombre) paciente, " +
                            "CONCAT(pacientes.telefono, ' | ', pacientes.celular) telefono, agenda.id_consultorio, agenda.id_turno, " +
                            "agenda.entreturno, agenda.presente, agenda.atendido, agenda.hora_llegada, agenda.costo, agenda.costo2, agenda.costo3 " +
                            "FROM agenda " +
                            "INNER JOIN medicos on agenda.id_medico = medicos.id " +
                            "INNER JOIN pacientes ON agenda.id_paciente = pacientes.id " +
                            "WHERE agenda.fecha = $1 AND agenda.id_medico = $2 " +
                            "ORDER BY agenda.id_paciente;", [req.params.fecha, req.params.medico])
                            .then(function(data) {
                                res.json({
                                    resultado: true,
                                    datos: data
                                });
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno al ver agenda: " + error
                                });
                            })
                    }
                    else {
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan parámetros para ver los turnos"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verTurnos(req, res) {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.fecha && req.params.consultorio && req.params.turno && req.params.entreturno){
                        db.oneOrNone("SELECT * FROM agenda WHERE fecha = $1 AND id_consultorio = $2 AND id_turno = $3 AND entreturno= $4;",
                            [req.params.fecha, req.params.consultorio, req.params.turno, req.params.entreturno])
                            .then(function(data) {
                                if(data){
                                    res.json({
                                        resultado: true,
                                        datos: data
                                    });
                                }
                                else{
                                    res.status(404).json({resultado: false, mensaje: "No se encuentra el turno"})
                                }
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno: " + error
                                });
                            })
                    }
                    else if (req.params.fecha && req.params.medico){
                        db.manyOrNone("SELECT agenda.id, CONCAT(pacientes.apellido, ' ', pacientes.nombre) paciente, CONCAT(pacientes.telefono, ' | ', pacientes.celular) telefono, agenda.id_consultorio, agenda.id_turno, agenda.entreturno, agenda.presente, agenda.atendido, agenda.hora_llegada, agenda.costo, agenda.costo2, agenda.costo3 FROM agenda INNER JOIN medicos on agenda.id_medico = medicos.id INNER JOIN pacientes ON agenda.id_paciente = pacientes.id WHERE agenda.fecha = $1 AND agenda.id_medico = $2 ORDER BY agenda.id_turno;", [req.params.fecha, req.params.medico])
                            .then(function(data) {
                                res.json({
                                    resultado: true,
                                    datos: data
                                });
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno al ver agenda: " + error
                                });
                            })
                    }
                    else if(req.params.fecha){
                        db.manyOrNone("SELECT * FROM agenda WHERE fecha = $1;", req.params.fecha)
                            .then(function(data) {
                                res.json({
                                    resultado: true,
                                    datos: data
                                });
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno al ver agenda: " + error
                                });
                            })
                    }
                    else {
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan parámetros para ver los turnos"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verTurnoPorId(req,res){
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.id){
                        db.manyOrNone("SELECT agenda.id, CONCAT(pacientes.apellido, ' ', pacientes.nombre) paciente, CONCAT(pacientes.telefono, ' | ', pacientes.celular) telefono, agenda.id_consultorio, agenda.id_turno, agenda.entreturno, agenda.presente, agenda.atendido, agenda.hora_llegada, agenda.costo, agenda.costo2, agenda.costo3 FROM agenda INNER JOIN medicos on agenda.id_medico = medicos.id INNER JOIN pacientes ON agenda.id_paciente = pacientes.id WHERE agenda.id = $1;", req.params.id)
                            .then(function(data) {
                                res.json({
                                    resultado: true,
                                    datos: data
                                });
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno al ver agenda: " + error
                                });
                            })
                    }
                    else {
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan parámetros para ver los turnos"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verAgendaResumen(req, res){
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    if (req.params.fecha){
                        db.manyOrNone("SELECT agenda.id_consultorio consultorio, agenda.id_turno turno, agenda.usuario usuario, agenda.entreturno entreturno, medicos.apellido apellido, agenda.presente presente, agenda.atendido atendido, agenda.hora_llegada hora_llegada FROM agenda INNER JOIN medicos ON agenda.id_medico = medicos.id WHERE agenda.fecha = $1;",
                            req.params.fecha)
                            .then(function(data) {
                                res.json({resultado: true, datos: data});
                            })
                            .catch(function(error) {
                                console.log(error);
                                res.status(500).json({
                                    resultado: false,
                                    mensaje: "Error interno: " + error
                                });
                            })
                    }
                    else {
                        console.log("Agenda sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan parámetros para ver los turnos"})
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function verConfiguracion(req, res) {
        var token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({
                        resultado: false,
                        mensaje: "Error de autenticación"
                    });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    db.func("turnos_ver_configuracion", [], qrm.one)
                        .then(function(data) {
                            res.json({
                                resultado: true,
                                datos: data
                            });
                        })
                        .catch(function(error) {
                            res.status(500).json({
                                resultado: false,
                                mensaje: "Error interno al ver configuraciones: " + error
                            });
                        })
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    return module;
};
