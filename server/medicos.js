/**
 * Created by falco on 30/1/2017.
 */
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

module.exports = function(db, pgp){
    var module = {};
    var qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;
    module.nuevaAnulacion = nuevaAnulacion;
    module.verAnulaciones = verAnulaciones;

    function verAnulaciones(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (req.params.fecha){
                        db.oneOrNone("select * from anulaciones where fecha = $1;", req.params.fecha)
                            .then(function(data){
                                res.json({resultado: true, datos: data})
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        console.log("Anuacion sin todos los datos necesarios");
                        res.status(400).json({resultado: false, mensaje: "Debe especificar una fecha!"})
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

    function nuevaAnulacion(req, res){
        var token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin"){
                        if (req.body.id_medico && req.body.fecha && req.body.desde && req.body.hasta && req.body.observaciones){
                            db.func("medicos_crear_anulacion", [req.body.id_medico, req.body.fecha, req.body.desde, req.body.hasta, req.body.observaciones], qrm.one)
                                .then(function(data){
                                    if (data.medicos_crear_anulacion === 'error-fecha'){
                                        res.status(400).json({resultado: false, mensaje: "Sólo se pueden crear anulaciones de hoy en adelante"})
                                    }
                                    else if (data.medicos_crear_anulacion === 'error-medico'){
                                        res.status(400).json({resultado: false, mensaje: "No se encuentra el médico seleccionado"});
                                    }
                                    else if(data.medicos_crear_anulacion === 'error-desde'){
                                        res.status(400).json({resultado: false, mensaje: "No se encuentra el horario de inicio"});
                                    }
                                    else if(data.medicos_crear_anulacion === 'error-hasta'){
                                        res.status(400).json({resultado: false, mensaje: "No se encuentra el horario de final"});
                                    }
                                    else if(data.medicos_crear_anulacion === 'error-rango'){
                                        res.status(400).json({resultado: false, mensaje: "Los hoarios deben ser de menor a mayor"});
                                    }
                                    else if(data.medicos_crear_anulacion === 'error-anulacion'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe una anulación para ese Médico en la fecha especificada"});
                                    }
                                    else if(data.medicos_crear_anulacion === 'ok'){
                                        res.json({resultado: true, mensaje: "Anulación creada"})
                                    }
                                    else {
                                        res.status(500).json({resultado: false, mensaje: "Error interno: " + data.medicos_crear_anulacion});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Anuacion sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para crear la anulación"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para crear anulaciones!"});
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
                    if (decoded.rol === "admin"){
                        if (req.params.id && req.body.nombre && req.body.apellido && req.body.mail){
                            db.func("medico_modificar", [req.params.id, req.body.nombre, req.body.apellido, req.body.mail], qrm.one)
                                .then(function(data){
                                    if (data.medico_modificar === 'error-medico'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Médico"});
                                    }
                                    else if(data.medico_modificar === 'error-mail'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Médico con ese email"})
                                    }
                                    else if (data.medico_modificar === 'ok'){
                                        res.json({resultado: true, mensaje: "Médico modificado"})
                                    }
                                    else{
                                        console.log("Error en medico_modificar: " + data);
                                        res.status(500).json({resultado: false, mensaje: "error interno"});
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Medico POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para la petición"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"no tiene permiso para modificar Médicos!"});
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
                    if (req.params.id){
                        db.oneOrNone("SELECT * FROM medicos WHERE id = $1;", req.params.id)
                            .then(function(data){
                                if (data){
                                    res.json({resultado: true, datos: data})
                                }
                                else {
                                    res.status(404).json({resultado: false, mensaje: "No se encuentra el Médico"})
                                }
                            })
                            .catch(function(err){
                                console.log(err);
                                res.status(500).json({resultado: false, mensaje: err})
                            })
                    }
                    else{
                        db.manyOrNone("SELECT * FROM medicos;")
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
                    if (decoded.rol === "admin"){
                        if (req.body.nombre && req.body.apellido && req.body.mail && req.body.usuario && req.body.clave){
                            var hash = bcrypt.hashSync(req.body.clave, 10);
                            db.func("medico_crear_v2", [req.body.nombre, req.body.apellido, req.body.mail, req.body.usuario, hash], qrm.one)
                                .then(function(data){
                                    if (data.medico_crear_v2 === 'error-mail'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Médico con ese email"})
                                    }
                                    else if (data.medico_crear_v2 === 'error-usuario'){
                                        res.status(400).json({resultado: false, mensaje: "Ya existe un Usuario con ese nombre"});
                                    }
                                    else if(data.medico_crear_v2 === 'error-rol'){
                                        res.status(500).json({resultado: false, mensaje: "Error interno de asignación de usuario"});
                                    }
                                    else {
                                        res.json({resultado: true, mensaje: "Médico creado", id: data.medico_crear_v2})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Medico sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos para crear el Médico"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para crear Médicos!"});
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
                            db.func("medico_borrar", req.params.id, qrm.one)
                                .then(function(data){
                                    if (data.medico_borrar == 'error-medico'){
                                        res.status(404).json({resultado: false, mensaje: "No se encuentra el Médico"})
                                    }
                                    else if (data.medico_borrar == 'ok') {
                                        res.json({resultado: true, mensaje: "Médico borrado"})
                                    }
                                    else{
                                        console.log("Error en medico_borrar: " + data.medico_borrar);
                                        res.status(500).json({resultado: false, mensaje: "Error no especificado:" + data.medico_borrar})
                                    }
                                })
                                .catch(function(err){
                                    console.log(err);
                                    if (err.code == '23503'){
                                        res.status(400).json({resultado: false, mensaje: "El médico tiene datos relacionados, no se puede borrar!"});
                                    }
                                    else{
                                        res.status(500).json({resultado: false, mensaje: err});
                                    }
                                })
                        }
                        else{
                            console.log("Medico POST sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos"})
                        }
                    }
                    else{
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({resultado: false, mensaje:"No tiene permiso para borrar Médicos!"});
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