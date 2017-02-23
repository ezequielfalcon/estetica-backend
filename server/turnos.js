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
                        console.log(req.body);
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
                                else if (data.agenda_nuevo_turno == 'ok') {
                                    res.json({resultado: true, mensaje: "Turno creado!", id: data.agenda_nuevo_turno})
                                }
                                else{
                                    res.status(500).json({resultado: false, mensaje: "Error interno: " + data.agenda_nuevo_turno});
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
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    console.log(req.params.fecha);
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
