/**
 * Created by falco on 27/1/2017.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    //module.borrar = borrar;
    module.traer = traer;
    //module.modificar = modificar;

    function traer(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (req.params.id){
                        db.oneOrNone("SELECT * FROM pacientes WHERE id = $1", req.params.id)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "no se encuentra el paciente"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        db.manyOrNone("SELECT * FROM pacientes")
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
                        if (req.body.nombre && req.body.apellido && req.body.documento
                            && req.body.fecha && req.body.telefono && req.body.mail
                            && req.body.sexo && req.body.id_os){
                            db.func("paciente_crear", [req.body.nombre, req.body.apellido, req.body.documento,
                                req.body.fecha, req.body.telefono, req.body.mail,
                                req.body.sexo, req.body.id_os], qrm.one)
                                .then(function(data){
                                    if (data.paciente_crear == 'error-paciente'){
                                        res.status(400).json({resultado: false, mensaje: "ya existe una Paciente con ese DNI"})
                                    }
                                    else if(data.paciente_crear == 'error-os'){
                                        res.status(400).json({resultado: false, mensaje: "no se encuentra la obra social"})
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Paciente creado", id: data.paciente_crear})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Paciente POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para crear Pacientes!"});
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