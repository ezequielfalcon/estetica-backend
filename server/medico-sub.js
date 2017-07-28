/**
 * Created by eze on 15/04/17.
 */
const jwt = require('jsonwebtoken');

module.exports = function(db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.turnos = turnos;
    module.atendido = atendido;

    function atendido(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    if (decoded.rol === 'medico') {
                        const medicoString = decoded.nombre;
                        if (req.params.id) {
                            db.func('medico_turno_atendido', [req.params.id, medicoString], qrm.one)
                                .then(function(data) {
                                    if (data.turno_medico_atendido === 'ok') {
                                        res.json({ resultado: true })
                                    } else if (data.turno_medico_atendido === 'error-turno') {
                                        res.status(404).json({ resultado: false, mensaje: "No se encuentra el turno especificado" });
                                    } else if (data.turno_medico_atendido === 'error-paciente') {
                                        res.status(400).json({ resultado: false, mensaje: "No puede marcar como atendido un paciente que no asistió" });
                                    } else if (data.turno_medico_atendido === 'error-fecha') {
                                        res.status(400).json({ resultado: false, mensaje: "No puede marcar como atendido un turno anterior o posterior" });
                                    } else {
                                        res.status(500).json({ resultado: false, mensaje: data.turno_medico_atendido })
                                    }
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            res.status(400).json({ resultado: false, mensaje: "Faltan parámetros para la consulta!" });
                        }
                    } else {
                        res.status(403).json({ resultado: false, mensaje: "Solo los médicos pueden realizar esta consulta!" });
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

    function turnos(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    if (decoded.rol === 'medico') {
                        const medicoString = decoded.nombre;
                        if (req.params.fecha) {
                            db.manyOrNone("select agenda.id, concat(pacientes.apellido, ' ', pacientes.nombre) paciente, agenda.id_consultorio, agenda.id_turno, agenda.entreturno, agenda.presente, agenda.atendido, agenda.hora_llegada from agenda inner join pacientes on agenda.id_paciente = pacientes.id  inner join medicos on agenda.id_medico = medicos.id INNER JOIN usuario_medico ON medicos.id = usuario_medico.id_medico inner join usuarios ON usuario_medico.usuario = usuarios.nombre where usuarios.nombre = $1 AND agenda.fecha =  $2;", [medicoString, req.params.fecha])
                                .then(function(data) {
                                    res.json({ resultado: true, datos: data })
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            res.status(400).json({ resultado: false, mensaje: "Faltan parámetros para la consulta!" });
                        }
                    } else {
                        res.status(403).json({ resultado: false, mensaje: "Solo los médicos pueden realizar esta consulta!" });
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

    return module;
};