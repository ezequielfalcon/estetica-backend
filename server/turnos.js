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
