/**
 * Created by eze on 18/01/17.
 */
const jwt = require('jsonwebtoken');

module.exports = function(db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;

    function modificar(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin") {
                        if (req.params.id && req.body.nombre) {
                            db.func("obra_social_modificar", [req.params.id, req.body.nombre], qrm.one)
                                .then(function(data) {
                                    if (data.obra_social_modificar === 'error-obra') {
                                        res.status(404).json({ resultado: false, mensaje: "No se encuentra la Obra Social" });
                                        console.log("error 404 en funcion ObraSocialModificar");
                                    } else if (data.obra_social_modificar === 'error-existe') {
                                        res.status(400).json({ resultado: false, mensaje: "Ya existe una Obra Social con ese nombre" })
                                    } else if (data.obra_social_modificar === 'ok') {
                                        res.json({ resultado: true, mensaje: "Obra Social modificada" })
                                    } else {
                                        console.log("Error en obra_social_modificar: " + data);
                                        res.status(500).json({ resultado: false, mensaje: "error interno" });
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            console.log("Obra social POST sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos en el POST" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "no tiene permiso para crear Obras Sociales!" });
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

    function traer(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (req.params.id) {
                        db.oneOrNone("SELECT * FROM obras_sociales WHERE id = $1;", req.params.id)
                            .then(function(data) {
                                if (data) {
                                    res.json({ resultado: true, datos: data })
                                } else {
                                    res.status(404).json({ resultado: false, mensaje: "no se encuentra la obra docial" })
                                }
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(500).json({ resultado: false, mensaje: err })
                            })
                    } else {
                        db.manyOrNone("SELECT * FROM obras_sociales ORDER BY nombre ASC;")
                            .then(function(data) {
                                res.json({ resultado: true, datos: data })
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(500).json({ resultado: false, mensaje: err })
                            })
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

    function crear(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin") {
                        if (req.body.nombre) {
                            db.func("obra_social_crear", req.body.nombre, qrm.one)
                                .then(function(data) {
                                    if (data.obra_social_crear === 'error-obra') {
                                        res.status(400).json({ resultado: false, mensaje: "ya existe una Obra Social con ese nombre" })
                                    } else {
                                        res.json({ resultado: true, mensaje: "Obra Social creada", id: data.obra_social_crear })
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            console.log("Obra social POST sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos en el POST" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "no tiene permiso para crear Obras Sociales!" });
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

    function borrar(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin") {
                        if (req.params.id) {
                            db.func("obra_social_borrar", req.params.id, qrm.one)
                                .then(function(data) {
                                    if (data.obra_social_borrar === 'error-obra') {
                                        res.status(400).json({ resultado: false, mensaje: "no existe una Obra Social con ese nombre" })
                                    } else if (data.obra_social_borrar === 'error-pacientes') {
                                        res.status(400).json({ resultado: false, mensaje: "La obra social está siendo usada por algún paciente" })
                                    } else if (data.obra_social_borrar === 'ok') {
                                        res.json({ resultado: true, mensaje: "Obra Social borrada" })
                                    } else {
                                        console.log("Error en obra_social_borrar: " + data.obra_social_borrar);
                                        res.status(500).json({ resultado: false, mensaje: "error no especificado:" + data.obra_social_borrar })
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    if (err.code === '23503') {
                                        res.status(400).json({ resultado: false, mensaje: "La obra social tiene datos relacionados, no se puede borrar!" });
                                    } else {
                                        res.status(500).json({ resultado: false, mensaje: err });
                                    }
                                })
                        } else {
                            console.log("Obra social POST sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos en el POST" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "no tiene permiso para borrar Obras Sociales!" });
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