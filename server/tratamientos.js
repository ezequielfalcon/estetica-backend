/**
 * Created by eze on 20/02/17.
 */
const jwt = require('jsonwebtoken');

module.exports = function(db, pgp) {
    let module = {};
    const qrm = pgp.queryResult;

    module.crear = crear;
    module.borrar = borrar;
    module.traer = traer;
    module.modificar = modificar;
    module.traerAgenda = traerAgenda;
    module.tratamientosBusqueda = tratamientosBusqueda;

    function tratamientosBusqueda(req, res) {
      let token = req.headers['x-access-token'];
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, function(err) {
          if (err) {
            console.log("Error de autenticación, token inválido!\n" + err);
            res.status(401).json({
              resultado: false,
              mensaje: "Error de autenticación"
            });
          } else {
            if (req.params.fechaOld && req.params.fechaNew) {
              db.many("SELECT id, nombre FROM tratamientos;")
                .then(tratamientos => {
                  if (tratamientos) {
                      let resultadoTratamientos = [];
                      let tratamientosListos = 0;
                      for (const tratamiento of tratamientos) {
                          let nuevoTrat = {};
                          nuevoTrat.id = tratamiento.id;
                          nuevoTrat.nombre = tratamiento.nombre;
                          db.one('SELECT COUNT(*) FROM agenda ' +
                            'INNER JOIN tratamientos_por_turno ' +
                            'ON agenda.id = tratamientos_por_turno.id_agenda ' +
                            'INNER JOIN tratamientos ' +
                            'ON tratamientos_por_turno.id_tratamiento = tratamientos.id ' +
                            'WHERE tratamientos.id = $1 AND agenda.fecha >= $2 ' +
                            'AND agenda.fecha <= $3;', [tratamiento.id, req.params.fechaOld, req.params.fechaNew])
                            .then(cantidadTrat => {
                                tratamiento.cantidad = cantidadTrat.count;
                                tratamientosListos++;
                                resultadoTratamientos.push(nuevoTrat);
                                if (tratamientosListos === tratamientos.length) {
                                    resultadoTratamientos.sort(ordenarId);
                                    res.json({resultado: true, datos: resultadoTratamientos})
                                }
                            })
                            .catch(function(err) {
                              console.log(err);
                              res.status(500).json({ resultado: false, mensaje: err })
                            })
                      }
                  } else {
                    res.json({ resultado: true, datos: {} })
                  }
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({ resultado: false, mensaje: err })
                })
            } else {
              console.log("Agenda sin todos los datos necesarios");
              res.status(400).json({ resultado: false, mensaje: "Faltan parámetros para ver los turnos" })
            }
          }
        });
      } else {
        res.status(401).json({
          resultado: false,
          mensaje: 'No token provided.'
        });
      }
    }

  function ordenarId(a, b) {
    if (a.id < b.id) {
      return -1;
    }
    if (a.id > b.id) {
      return 1;
    }
    return 0;
  }

    function traerAgenda(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    if (req.params.id) {
                        db.manyOrNone("SELECT tratamientos.id, tratamientos.nombre, tratamientos.costo FROM tratamientos INNER JOIN tratamientos_por_turno ON tratamientos.id = tratamientos_por_turno.id_tratamiento WHERE tratamientos_por_turno.id_agenda = $1;",
                                req.params.id)
                            .then(function(data) {
                                res.json({ resultado: true, datos: data })
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(500).json({ resultado: false, mensaje: err })
                            })
                    } else {
                        console.log("Tratamiento GET sin todos los datos necesarios");
                        res.status(400).json({ resultado: false, mensaje: "Faltan datos para la petición" })
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function modificar(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    if (decoded.rol === "admin") {
                        if (req.params.id && req.body.nombre) {
                            const costo = req.body.costo || 0;
                            db.func("tratamientos_modificar", [req.params.id, req.body.nombre, costo], qrm.one)
                                .then(function(data) {
                                    if (data.tratamientos_modificar === 'error-tratamiento') {
                                        res.status(404).json({ resultado: false, mensaje: "No se encuentra el Tratamiento" });
                                    } else if (data.tratamientos_modificar === 'error-nombre') {
                                        res.status(400).json({ resultado: false, mensaje: "Ya existe un Tratamiento con ese nombre" })
                                    } else if (data.tratamientos_modificar === 'ok') {
                                        res.json({ resultado: true, mensaje: "Tratamiento modificado" })
                                    } else {
                                        console.log("Error en tratamiento_modificar: " + data);
                                        res.status(500).json({ resultado: false, mensaje: "error interno: " + data.tratamiento_modificar });
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            console.log("Tratamiento PUT sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos para la petición" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "no tiene permiso para modificar Tratamientos!" });
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function traer(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    if (req.params.id) {
                        db.oneOrNone("SELECT * FROM tratamientos WHERE id = $1;", req.params.id)
                            .then(function(data) {
                                if (data) {
                                    res.json({ resultado: true, datos: data })
                                } else {
                                    res.status(404).json({ resultado: false, mensaje: "No se encuentra el Tratamiento" })
                                }
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(500).json({ resultado: false, mensaje: err })
                            })
                    } else {
                        db.manyOrNone("SELECT * FROM tratamientos;")
                            .then(function(data) {
                                res.json({ resultado: true, datos: data })
                            })
                            .catch(function(err) {
                                console.log(err);
                                res.status(500).json({ resultado: false, mensaje: err })
                            })
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function crear(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin") {
                        if (req.body.nombre) {
                            const costo = req.body.costo || 0;
                            db.func("tratamientos_crear", [req.body.nombre, costo], qrm.one)
                                .then(function(data) {
                                    if (data.tratamientos_crear === 'error-nombre') {
                                        res.status(400).json({ resultado: false, mensaje: "Ya existe un Tratamiento con ese nombre" })
                                    } else {
                                        res.json({ resultado: true, mensaje: "Tratamiento creado" })
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    res.status(500).json({ resultado: false, mensaje: err })
                                })
                        } else {
                            console.log("Tratamiento sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos para crear el Tratamiento" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "No tiene permiso para crear Médicos!" });
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    function borrar(req, res) {
        const token = req.headers['x-access-token'];
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
                if (err) {
                    console.log("Error de autenticación, token inválido!\n" + err);
                    res.status(401).json({ resultado: false, mensaje: "Error de autenticación" });
                } else {
                    console.log("Usuario " + decoded.nombre + " autorizado");
                    if (decoded.rol === "admin") {
                        if (req.params.id) {
                            db.func("tratamientos_borrar", req.params.id, qrm.one)
                                .then(function(data) {
                                    if (data.tratamientos_borrar === 'error-tratamiento') {
                                        res.status(404).json({ resultado: false, mensaje: "No se encuentra el Tratamiento" })
                                    } else if (data.tratamientos_borrar === 'ok') {
                                        res.json({ resultado: true, mensaje: "Tratamiento borrado" })
                                    } else {
                                        console.log("Error en tratamiento_borrar: " + data.tratamientos_borrar);
                                        res.status(500).json({ resultado: false, mensaje: "Error no especificado:" + data.tratamientos_borrar })
                                    }
                                })
                                .catch(function(err) {
                                    console.log(err);
                                    if (err.code === '23503') {
                                        res.status(400).json({ resultado: false, mensaje: "El tratamiento tiene datos relacionados, no se puede borrar!" });
                                    } else {
                                        res.status(500).json({ resultado: false, mensaje: err });
                                    }
                                })
                        } else {
                            console.log("Tratameitno DELETE sin todos los datos necesarios");
                            res.status(400).json({ resultado: false, mensaje: "Faltan datos" })
                        }
                    } else {
                        console.log("Usuario " + decoded.nombre + " no autorizado");
                        res.status(403).json({ resultado: false, mensaje: "No tiene permiso para borrar Tratamientos!" });
                    }
                }
            });
        } else {
            res.status(401).json({
                resultado: false,
                mensaje: 'No token provided.'
            });
        }
    }

    return module;
};