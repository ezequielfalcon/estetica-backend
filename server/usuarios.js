/**
 * Created by eze on 16/01/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function (db) {
    var module = {};

    module.usuarios = usuariosFunc;

    function usuariosFunc (req, res, next){
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