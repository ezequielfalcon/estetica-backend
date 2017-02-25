/**
 * Created by eze on 20/02/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;
    module.traerAgenda = traerAgenda;

    function traerAgenda(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (req.params.id_agenda){
                        db.manyOrNone("SELECT id_tratamiento FROM tratamientos_por_turno WHERE id_agenda = $1;",
                            req.params.id_agenda)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "No se encuentra"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Tratamiento GET sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Faltan datos para la petición"})
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
                        if (req.params.id && req.body.nombre && req.body.costo){
                            db.func("tratamientos_modificar", [req.params.id, req.body.nombre, req.body.costo], qrm.one)
                                .then(function(data){
                                    if (data.tratamientos_modificar == 'error-tratamiento'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Tratamiento"});
                                    }
                                    else if(data.tratamientos_modificar == 'error-nombre'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Tratamiento con ese nombre"})
                                    }
                                    else if (data.tratamientos_modificar == 'ok'){
                                        res.json({resultado: true, mensaje: "Tratamiento modificado"})
                                    }
                                    else{
                                        console.log("Error en tratamiento_modificar: " + data);
                                        res.status(500).json({resultado: false, mensaje: "error interno: " + data.tratamiento_modificar});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Tratamiento PUT sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para la petición"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para modificar Tratamientos!"});
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
                        db.oneOrNone("SELECT * FROM tratamientos WHERE id = $1;", req.params.id)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "No se encuentra el Tratamiento"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        db.manyOrNone("SELECT * FROM tratamientos;")
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
                        if (req.body.nombre && req.body.costo){
                            db.func("tratamientos_crear", [req.body.nombre, req.body.costo], qrm.one)
                                .then(function(data){
                                    if (data.tratamientos_crear == 'error-nombre'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Tratamiento con ese nombre"})
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Tratamiento creado"})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Tratamiento sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para crear el Tratamiento"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para crear Médicos!"});
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
                            db.func("tratamientos_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.tratamientos_borrar == 'error-tratamiento'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Tratamiento"})
                                    }
                                    else if (data.tratamientos_borrar == 'ok') {
                                        res.json({resultado: true, mensaje: "Tratamiento borrado"})
                                    }
                                    else{
                                        console.log("Error en tratamiento_borrar: " + data.tratamientos_borrar);
                                        res.status(500).json({resultado: false, mensaje: "Error no especificado:" + data.tratamientos_borrar})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Tratameitno DELETE sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para borrar Tratamientos!"});
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