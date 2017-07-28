/**
 * Created by eze on 16/01/17.
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports= function(db) {
    let module = {};

    module.login = login;

    function login(req, res, next){
        if (req.body.usuario && req.body.clave){
            const user = req.body.usuario;
            db.oneOrNone("SELECT usuarios.nombre, usuarios.clave, roles.nombre rol FROM usuarios INNER JOIN roles ON usuarios.id_rol = roles.id WHERE usuarios.nombre = $1;", user)
                .then(function(data){
                    if (data === null){
                        console.log("Usuario inexistente intentó inciar sesión: " + user);
                        res.status(400).json({
                            resultado: false,
                            mensaje: "El usuario no existe"
                        })
                    }
                    else{
                        const hashDb = data.clave;
                        if (bcrypt.compareSync(req.body.clave, hashDb)){
                            console.log("Inicio de sesión de usuario " + user);
                            const usuarioDb = {
                                nombre: user,
                                rol: data.rol
                            };
                            const token = jwt.sign(usuarioDb, process.env.JWT_SECRET, {expiresIn: "20h"});
                            res.json({
                                resultado: true,
                                mensaje: "Sesión iniciada",
                                token: token,
                                usuario: usuarioDb
                            })
                        }
                        else{
                            console.log("Inicio de sesión no válida por usuario " + user);
                            res.status(401).json({
                                resultado: false,
                                mensaje: "Credenciales no válidas"
                            })
                        }
                    }
                })
                .catch(function (err) {
                    return next(err);
                });
        }
        else{
            console.log("error en el POST para login" + req.body);
            res.status(400).json({resultado: false, mensaje: "faltan datos del post: usuario y clave"})
        }

    }
    return module;
};