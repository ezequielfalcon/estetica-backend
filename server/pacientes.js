/**
 * Created by falco on 27/1/2017.
 */
var jwt = require('jsonwebtoken');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;
    module.buscar = buscar;

    function buscar(req,res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol === 'usuario' || decoded.rol === 'admin' || decoded.rol === 'medico'){
                        if (req.body.nombre || req.body.apellido || req.body.documento){
                            var nom = req.body.nombre + '%';
                            var ape = req.body.apellido + '%';
                            var dni = req.body.documento + '%';
                            db.manyOrNone("select * from pacientes where nombre ILIKE $1 AND apellido ILIKE $2 AND documento ILIKE $3 ORDER BY fecha_alta DESC LIMIT 50;",
                                [nom, ape, dni])
                                .then(function(data){
                                    res.json({resultado: true, datos: data})
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            res.status(400).json({resutado: false, mensaje: "Falta un parámetro de búsqueda!"});
                        }
                    }
                    else{
                        res.status(403).json({resultado: false, mensaje: 'Permiso denegado!'});
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
                    if (decoded.rol === 'usuario' || decoded.rol === 'admin' || decoded.rol === 'medico'){
                        if (req.params.id){
                            db.oneOrNone("SELECT * FROM pacientes WHERE id = $1;", req.params.id)
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
                            db.manyOrNone("select * from pacientes ORDER BY fecha_alta DESC LIMIT 100;")
                                .then(function (data){
                                    res.json({resultado: true, datos: data})
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                    }
                    else{
                        res.status(403).json({resultado: false, mensaje: 'Permiso denegado!'});
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
                    if (decoded.rol == 'usuario' || decoded.rol == 'admin'){
                        if (req.body.nombre && req.body.apellido && req.body.documento
                            && req.body.fecha && req.body.telefono && req.body.mail
                            && req.body.sexo && req.body.id_os && req.body.numero_os
                            && req.body.domicilio && req.body.obs){
                            db.func("paciente_crear", [req.body.nombre, req.body.apellido, req.body.documento,
                                req.body.fecha, req.body.telefono, req.body.mail,
                                req.body.sexo, req.body.id_os, req.body.numero_os,
                                req.body.domicilio, req.body.obs], qrm.one)
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

    function modificar(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol == 'usuario' || decoded.rol == 'admin'){
                        if (req.body.nombre && req.body.apellido && req.body.documento
                            && req.body.fecha && req.body.telefono && req.body.mail
                            && req.body.sexo && req.body.id_os && req.body.numero_os
                            && req.body.domicilio && req.body.obs && req.params.id){
                            db.func("paciente_modificar", [req.params.id, req.body.nombre,
                                req.body.apellido, req.body.documento,
                                req.body.fecha, req.body.telefono, req.body.mail,
                                req.body.sexo, req.body.id_os, req.body.numero_os,
                                req.body.domicilio, req.body.obs], qrm.one)
                                .then(function(data){
                                    if (data.paciente_modificar == 'error-paciente'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el paciente"})
                                    }
                                    else if (data.paciente_modificar == 'error-dni'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un paciente con ese Documento!"})
                                    }
                                    else if(data.paciente_modificar == 'error-os'){
                                        res.status(400).json({resultado: false, mensaje: "no se encuentra la obra social"})
                                    }
                                    else if(data.paciente_modificar == 'ok'){
                                        res.json({resultado: true, mensaje: "Paciente modificado"})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: "error interno! " + data.paciente_modificar})
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
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para modificar Pacientes!"});
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
                            db.func("paciente_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.paciente_borrar == 'error-paciente'){
                                        res.status(404).json({resultado: false, mensaje: "no se encuentra el paciente"})
                                    }
                                    else if (data.paciente_borrar == 'ok') {
                                        res.json({resultado: true, mensaje: "Paciente borrado"})
                                    }
                                    else{
                                        console.log("Error en paciente_borrar: " + data.paciente_borrar);
                                        res.status(500).json({resultado: false, mensaje: "error no especificado:" + data.paciente_borrar})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    if (err.code == '23503'){
                                        res.status(400).json({resultado: false, mensaje: "El paciente tiene datos relacionados, no se puede borrar!"});
                                    }
                                    else{
                                        res.status(500).json({resultado: false, mensaje: err});
                                    }

                                })
                        }
                        else{
                            console.log("Paciente POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos en el POST"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para borrar Pacientes!"});
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