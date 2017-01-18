/**
 * Created by eze on 16/01/17.
 */
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

module.exports = function (db, pgp) {
    var module = {};
    var qrm = pgp.queryResult;

    module.usuarios = usuariosFunc;
    module.usuario = usuario;
    module.nuevoUsuario = nuevoUsuario;
    module.borrarUsuario = borrarUsuario;
    module.modificarUsuario = modificarUsuario;

    function usuario(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    db.oneOrNone("SELECT usuarios.nombre, roles.nombre rol FROM usuarios INNER JOIN roles ON usuarios.id_rol = roles.id WHERE usuarios.nombre = $1;", req.params.id)
                        .then(function(data){
                            res.json({resultado: true, datos: data});
                        })
                        .catch(function(err){
                            res.json({resultado: false, mensaje: err})
                        })
                }
            });
        }
        else{
            res.status(403).send({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function modificarUsuario(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol == "admin"){
                        var rolExiste = db.one("SELECT id FROM roles WHERE nombre = $1;", req.body.rol)
                            .then(function(data){
                                return data.id;
                            })
                            .catch(function(err){
                                console.log(err);
                                return null;
                            });
                        if (rolExiste == null){
                            db.one("INSERT INTO roles (nombre) VALUES ($1) RETURNING id;", req.body,rol)
                                .then(function(data){
                                    rolExiste = data.id;
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.json({resultado: false, mensaje: err});
                                })
                        }
                        var hash = bcrypt.hashSync(req.body.clave, 10);
                        db.none("UPDATE usuarios SET clave = $1, rol = $2 WHERE nombre = $3;", hash, rolExiste, req.params.id)
                            .then(function(){
                                console.log("Usuario " + req.params.id + " borrado!!");
                                res.json({resultado: true, mensaje: "usuario borrado"})
                            })
                            .catch(function (err){
                                console.log(err);
                                res.json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.json({resultado: false, mensaje:"no tiene permiso para crear usuarios!"});
                    }
                }
            });
        }
        else{
            res.status(403).send({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function borrarUsuario(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol == "admin"){
                        if (req.params.id != decoded.nombre){
                            db.func('usuario_borrar', req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.usuario_borrar == 'ok'){
                                        res.json({resultado: true, mensaje: "Usuario borrado"})
                                    }
                                    else if (data.usuario_borrar == 'error-usuario'){
                                        res.json({resultado: false, mensaje:"No se encuentra el usuario " + req.params.id})
                                    }
                                    else{
                                        res.json({resultado: false, mensaje: "Error no especificado: " + data.usuario_borrar})
                                    }
                                })
                                .catch(function(err){
                                    res.json({resultado:false, mensaje: err})
                                })
                        }
                        else res.json({resultado: false, mensaje: "no se puede borrar a sí mismo"});
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.json({resultado: false, mensaje:"no tiene permiso para borrar usuarios!"});
                    }
                }
            });
        }
        else{
            res.status(403).send({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function nuevoUsuario (req, res){
        var token = req.headers['x-access-token'];
        if (token){
            if(req.body.usuario && req.body.clave && req.body.rol){
                jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                    if (err){
                        console.log("Error de autenticación, token inválido!\n" + err);
                        res.json({resultado: false, mensaje: "Error de autenticación"});
                    }
                    else{
                        if (decoded.rol == "admin"){
                            console.log("Usuario " + decoded.nombre + " autorizado");
                            var hash = bcrypt.hashSync(req.body.clave, 10);
                            db.func('usuario_crear', [req.body.usuario, hash, req.body.rol], qrm.one)
                                .then(function (data){
                                    if (data.usuario_crear == 'error-rol'){
                                        console.log("Intento de crear usuario con rol no existente!");
                                        res.json({resultado: false, mensaje: "El rol especificado no existe"})
                                        return;
                                    }
                                    if (data.usuario_crear == 'error-usuario'){
                                        console.log("Intento de crear usuario repetido");
                                        res.json({resultado: false, mensaje: "El nombre de usuario ya existe"})
                                        return;
                                    }
                                    if (data.usuario_crear == 'ok'){
                                        console.log("Usuario creado");
                                        res.json({resultado: true, mensaje: "Usuario creado"})
                                    }
                                    else{
                                        console.log("Error no especificado: " + data.usuario_crear);
                                        res.json({resultado: false, mensaje: "Error no especificado de DB"})
                                    }
                                })
                                .catch(function (err){
                                    console.log(err);
                                    res.json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Usuario " + decoded.nombre + " no autorizado");
                            res.json({resultado: false, mensaje:"no tiene permiso para crear usuarios!"});
                        }
                    }
                });
            }
            else{
                console.log("Usuario POST sin todos los datos necesarios");
                res.json({resultado: false, mensaje: "Faltan datos en el POST"})
            }
        }
        else{
            res.status(403).send({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function usuariosFunc (req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    db.many("SELECT usuarios.nombre, roles.nombre rol FROM usuarios INNER JOIN roles ON usuarios.id_rol = roles.id;")
                        .then(function(data){
                            res.json({resultado: true, datos: data});
                        })
                        .catch(function(err){
                            res.json({resultado: false, mensaje: err})
                        })
                }
            });
        }
        else{
            res.status(403).send({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    return module;
};