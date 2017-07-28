/**
 * Created by eze on 09/04/17.
 */
const jwt = require('jsonwebtoken');

module.exports = function(db, pgp) {
    let module = {};

    module.consultar = consultar;
    module.insertar = insertar;

    function consultar(req, res){
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol === 'usuario' || decoded.rol === 'admin'){
                        if (req.params.id){
                            db.manyOrNone("SELECT * FROM cuenta_corriente WHERE id_paciente = $1;", req.params.id)
                                .then(function(data){
                                    res.json({resultado: true, datos: data})
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            db.manyOrNone("select pacientes.id id, concat(pacientes.nombre, ' ', pacientes.apellido) paciente, max(cuenta_corriente.fecha) ultimo_movimiento, sum(cuenta_corriente.monto) monto FROM cuenta_corriente INNER JOIN pacientes ON cuenta_corriente.id_paciente = pacientes.id WHERE monto != 0 GROUP BY pacientes.id ORDER BY monto DESC LIMIT 100;")
                                .then(function(data){
                                    res.json({resultaro: true, datos: data})
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

    function insertar(req, res){
        const token = req.headers['x-access-token'];
        if (token){
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded){
                if (err){
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({resultado: false, mensaje: "Error de autenticación"});
                }
                else{
                    if (decoded.rol === 'usuario' || decoded.rol === 'admin'){
                        if (req.body.id_paciente && req.body.concepto){
                            let monto = req.body.monto || 0;
                            db.manyOrNone("INSERT INTO cuenta_corriente (id_paciente, fecha, concepto, monto) VALUES ($1, CURRENT_DATE, $2, $3);", [req.body.id_paciente, req.body.concepto, monto])
                                .then(function(){
                                    res.json({resultado: true})
                                })
                                .catch(function(err){
                                    console.log(err);
                                    res.status(500).json({resultado: false, mensaje: err})
                                })
                        }
                        else{
                            console.log("Consulta de cuenta corriente sin todos los datos necesarios");
                            res.status(400).json({resultado: false, mensaje: "Faltan datos"})
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

    return module;
};