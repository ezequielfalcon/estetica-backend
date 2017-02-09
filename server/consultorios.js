/**
 * Created by eze on 08/02/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;

    function modificar(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol == "admin"){
                        if (req.params.id && req.body.nombre ){
                            db.func("consultorios_modificar", [req.params.id, req.body.nombre], qrm.one)
                                .then(function(data){
                                    if (data.consultorios_modificar == 'error-consultorio'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Consultorio"});
                                    }
                                    else if(data.consultorios_modificar == 'error-nombre'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Consultorio con ese nombre"})
                                    }
                                    else if (data.consultorios_modificar == 'ok'){
                                        res.json({resultado: true, mensaje: "Consultorio modificado"})
                                    }
                                    else{
                                        console.log("Error en consultorios_modificar: " + data);
                                        res.status(500).json({resultado: false, mensaje: "error interno"});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Consultorio POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para la petición"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para modificar Consultorios!"});
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

    function traer(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (req.params.id){
                        db.oneOrNone("SELECT * FROM consultorios WHERE id = $1;", req.params.id)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "No se encuentra el Consultorio"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        db.manyOrNone("SELECT * FROM consultorios;")
                            .then(function (data){
                                res.json({resultado: true, datos: data})
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
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

    function crear(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol == "admin"){
                        if (req.body.id && req.body.nombre){
                            db.func("consultorios_crear", [req.body.id, req.body.nombre], qrm.one)
                                .then(function(data){
                                    if (data.consultorios_crear == 'error-consultorio'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Consultorio con ese nombre o ID"})
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Consultorio creado", id: data.consultorios_crear})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Consultorio sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para crear el Consultorio"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para crear Consultorios!"});
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

    function borrar(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol == "admin"){
                        if (req.params.id){
                            db.func("consultorios_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.consultorios_borrar == 'error-consultorio'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Consultorio"})
                                    }
                                    else if (data.consultorios_borrar == 'ok') {
                                        res.json({resultado: true, mensaje: "Consultorio borrado"})
                                    }
                                    else{
                                        console.log("Error en consultorios_borrar: " + data.consultorios_borrar);
                                        res.status(500).json({resultado: false, mensaje: "Error no especificado:" + data.consultorios_borrar})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Consultorio DELETE sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para borrar Consultorios!"});
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

    return module;
};