/**
 * Created by eze on 16/01/17.
 */
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

module.exports= function(db) {
    var module = {};

    module.login = login;

    function login(req, res, next){
        var user = req.body.usuario;
        var pass = req.body.clave;
        db.oneOrNone("SELECT usuarios.nombre, usuarios.clave, roles.nombre rol FROM usuarios INNER JOIN roles ON usuarios.id_rol = roles.id WHERE usuarios.nombre = $1;", user)
            .then(function(data){
                if (data == null){
                    console.log("Usuario inexistente intentó inciar sesión: " + user);
                    res.json({
                        resultado: false,
                        mensaje: "El usuario no existe"
                    })
                }
                else{
                    var hashDb = data.clave;
                    if (bcrypt.compareSync(req.body.clave, hashDb)){
                        console.log("Inicio de sesión de usuario " + user);
                        var usuarioDb = {
                            nombre: user,
                            rol: data.rol
                        };
                        var token = jwt.sign(usuarioDb, process.env.JWT_SECRET);
                        console.log("Token generado: " + token + '..');
                        res.json({
                            resultado: true,
                            mensaje: "Sesión iniciada",
                            token: token
                        })
                    }
                    else{
                        console.log("Inicio de sesión no válida por usuario " + user);
                        res.json({
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

    return module;
};