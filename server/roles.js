/**
 * Created by eze on 19/01/17.
 */
const jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    let module = {};
    const qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;

    function modificar(req, res){
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin"){
                        if (req.params.id && req.body.nombre){
                            db.func("rol_modificar", [req.params.id, req.body.nombre], qrm.one)
                                .then(function(data){
                                    if (data.rol_modificar === 'error-rol'){
                                        res.status(404).json({resultado: false, mensaje: "no se encuentra el rol"})
                                    }
                                    else if(data.rol_modificar === 'error-existe'){
                                        res.status(400).json({resultado: false, mensaje: "ya existe un rol con ese nombre"})
                                    }
                                    else if (data.rol_modificar === 'ok'){
                                        res.json({resultado: true, mensaje: "Rol modificado"})
                                    }
                                    else{
                                        console.log("Error en rol_modificar: " + data);
                                        res.status(500).json({resultado: false, mensaje: "error interno"});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Rol POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para crear Roles!"});
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
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (req.params.id){
                        db.oneOrNone("SELECT * FROM roles WHERE nombre = $1", req.params.id)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "no se encuentra el rol"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        db.manyOrNone("SELECT * FROM roles")
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
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin"){
                        if (req.body.nombre){
                            db.func("rol_crear", req.body.nombre, qrm.one)
                                .then(function(data){
                                    if (data.rol_crear === 'error-rol'){
                                        res.status(400).json({resultado: false, mensaje: "ya existe un rol con ese nombre"})
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Rol creado", id: data.rol_crear})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Rol POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para crear Roles!"});
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
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin"){
                        if (req.params.id){
                            db.func("rol_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.rol_borrar === 'error-rol'){
                                        res.status(400).json({resultado: false, mensaje: "no existe un rol con ese nombre"})
                                    }
                                    else if(data.rol_borrar === 'error-usuarios'){
                                        res.status(400).json({resultado: false, mensaje: "El rol está siendo usado por algún usuario"})
                                    }
                                    else if (data.rol_borrar === 'ok') {
                                        res.json({resultado: true, mensaje: "Rol borrado"})
                                    }
                                    else{
                                        console.log("Error en obra_social_borrar: " + data.rol_borrar);
                                        res.status(500).json({resultado: false, mensaje: "error no especificado:" + data.rol_borrar})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("ROL DELETE sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para borrar roles!"});
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