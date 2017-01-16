var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var jwt    = require('jsonwebtoken');

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true }));


app.set('port', (process.env.PORT || 5000));

app.post('/login', function (req, res) {
    var user = req.body.usuario;
    var pass = req.body.clave;
    var hashDb = null;
    pg.connect(process.env.DATABASE_URL, function(err, client, done){
        client.query({
            text: "SELECT nombre, clave FROM usuarios WHERE nombre = $1;",
            values:[user]
        }, function(err, result){
            done();
            if (err){
                console.log(err);
                res.json({success: false, message: err});
            }
            if (result.rows[0] != null){
                hashDb = result.rows[0].clave;
                bcrypt.compare(pass, hashDb, function(err, hashRes){
                    if(err) {
                        console.log(err);
                        res.json({success: false, message: err});
                    }
                    if (hashRes) {
                        console.log("Inicio de sesión por usuario " + user);
                        var token = jwt.sign(user, process.env.JWT_SECRET, {
                            expiresInMinutes: 1440
                        });
                        res.json({success: true, message: "sesión iniciada", token: token});
                    }
                    else {
                        console.log("Inicio de sesión no válido para " + user);
                        res.json({success: false, message: "credenciales no válidas!"})
                    }
                })
            }
            else{
                console.log("Usuario inexistente intentó iniciar sesión: " + user);
                res.json({success: false, message: "credenciales no válidas!"})
            }
        })
    });
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});