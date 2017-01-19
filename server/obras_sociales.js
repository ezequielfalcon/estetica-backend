/**
 * Created by eze on 18/01/17.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;

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
                        if (req.body.nombre){
                            db.func("obra_social_crear", req.body.nombre, qrm.one)
                                .then(function(data){
                                    if (data.obra_social_crear == 'error-obra'){
                                        res.status(400).json({resultado: false, mensaje: "ya existe una Obra Social con ese nombre"})
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Obra Social creada", id: data.obra_social_crear})
                                    }
                                })
                        }
                        else{
                            console.log("Obra social POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para crear Obras Sociales!"});
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
                            db.func("obra_social_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.obra_social_borrar == 'error-obra'){
                                        res.status(400).json({resultado: false, mensaje: "no existe una Obra Social con ese nombre"})
                                    }
                                    else if(data.obra_social_borrar){

                                    }
                                    else if (data.obra_social_borrar == 'ok') {
                                        res.json({resultado: true, mensaje: "Obra Social borrada", id: data.obra_social_borrar})
                                    }
                                    else{
                                        console.log("Error en obra_social_borrar: " + data.obra_social_borrar);
                                        res.status(500).json({resultado: false, mensaje: "error no especificado:" + data.obra_social_borrar})
                                    }
                                })
                        }
                        else{
                            console.log("Obra social POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para crear Obras Sociales!"});
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