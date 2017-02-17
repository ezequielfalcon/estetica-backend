/**
 * Created by eze on 11/02/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.verConfiguracion = verConfiguracion;
    module.verTurnos = verTurnos;

    function verTurnos(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    db.many("SELECT * FROM agenda WHERE fecha = '$1';", req.params.fecha)
                        .then(function(data){
                            res.json({resultado: true, datos: data});
                        })
                        .catch(function(error){
                            res.status(500).json({resultado: false, mensaje: "Error interno al ver configuraciones: " + error});
                        })
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

    function verConfiguracion(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    db.func("turnos_ver_configuracion", [], qrm.one)
                        .then(function(data){
                            res.json({resultado: true, datos: data});
                        })
                        .catch(function(error){
                            res.status(500).json({resultado: false, mensaje: "Error interno al ver configuraciones: " + error});
                        })
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
