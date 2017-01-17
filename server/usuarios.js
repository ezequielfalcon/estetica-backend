/**
 * Created by eze on 16/01/17.
 */
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

module.exports = function (db) {
    var module = {};

    module.usuarios = usuariosFunc;
    module.nuevoUsuario = nuevoUsuario;
    module.borrarUsuario = borrarUsuario;
    module.modificarUsuario = modificarUsuario;

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
                            db.none("DELETE FROM usuarios WHERE nombre = $1;", req.params.id)
                                .then(function(){
                                    console.log("Usuario " + req.params.id + " borrado!!");
                                    res.json({resultado: true, mensaje: "usuario borrado"})
                                })
                                .catch(function (err){
                                    console.log(err);
                                    res.json({resultado: false, mensaje: err})
                                })
                        }
                        else res.json({resultado: false, mensaje: "no se puede borrar a sí mismo"});
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

    function nuevoUsuario (req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol == "admin"){
                        console.log("Usuario " + decoded.nombre + " autorizado");
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
                        var usuarioExiste = db.oneOrNone("SELECT nombre FROM usuarios WHERE nombre = $1", req.body.usuario)
                            .then(function(data){
                                return req.body.usuario == data.nombre;
                            })
                            .catch(function(err){
                                console.log(err);
                                return false;
                            });
                        if (!usuarioExiste){
                            db.none("INSERT INTO usuarios (nombre, rol) VALUES ($1, $2", req.body.usuario, rolExiste)
                                .then(function(){
                                    console.log("Se creó el usuario " + req.body.usuario + " con el rol " + req.body.rol);
                                    res.json({resultado: true, mensaje: "Usuario creado!"});
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.json({resultado: false, mensaje: err});
                                })
                        }
                        else{
                            console.log("Intento de crear usuario con nombre repetido");
                            res.json({resultado: false, mensaje: "El usuario ya existe!"});
                        }
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