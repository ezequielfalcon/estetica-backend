/**
 * Created by eze on 16/01/17.
 */
var bcrypt = require('bcrypt');
var pgp = require("pg-promise")();
var db = pgp(process.env.DATABASE_URL);
var jwt    = require('jsonwebtoken');

module.exports= {
    login: login
};

function login(req, res, next){
    var user = req.body.usuario;
    var pass = req.body.clave;
    db.oneOrNone("SELECT clave FROM usuarios WHERE nombre = $1;", user)
        .then(function(data){
            if (data == null){
                console.log("Usuario inexistente intentó inciar sesión: " + user);
                res.send({
                    resultado: false,
                    mensaje: "El usuario no existe"
                })
            }
            else{
                console.log(data);
                res.send({
                    resultado: true,
                    mensaje: "sesión iniciada!"
                })
            }
        })
        .catch(function (err) {
            return next(err);
        });
}