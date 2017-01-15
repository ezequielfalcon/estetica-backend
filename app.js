var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
// Generate a salt
var salt = bcrypt.genSaltSync(10);

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


app.set('port', (process.env.PORT || 5000));

app.post('/createlogin', function (req, res) {
    var user = req.body.usuario;
    var pass = req.body.clave;
    var hash = bcrypt.hashSync(pass, salt);
    pg.connect(process.env.DATABASE_URL, function(err, client, done){
        client.query({
            text: "SELECT * FROM comprobar_usuario($1,$2);",
            values:[user, hash]
        }, function(err, result){
            done();
            if (err){
                console.log(err);
                res.send("err");
            }
        })
    })
});

app.post('/login', function (req, res) {
    var user = req.body.usuario;
    var pass = req.body.clave;

    var hashDb = pg.connect(process.env.DATABASE_URL, function(err, client, done){
        client.query({
            text: "SELECT * FROM usuarios WHERE nombre = $1;",
            values:[user]
        }, function(err, result){
            done();
            if (err){
                console.log(err);
                return null;
            }
            else{
                if (result.rows[0].nombre =! null){
                    return result.rows[0].clave;
                }
                else{
                    return null;
                }
            }
        })
    });

    if (hashDb == null){
        console.log("Usuario inexistente intentó iniciar sesión: " + user);
        res.send("notok");
    }

    bcrypt.compare(pass, hashDb, function(err, hashRes){
        if(err) {
            console.log(err);
            res.send("err");
        }
        if (hashRes) {
            console.log("Inicio de sesión por usuario " + user);
            res.send("ok");
        }
        else {
            console.log("Inicio de sesión no válido para " + user);
            res.send("notok");
        }
    })
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});