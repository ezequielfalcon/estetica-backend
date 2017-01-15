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

app.post('/login', function (req, res) {
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
            else{
                if (result.rows[0].comprobar_usuario){
                    res.send("vamo carajo");
                    console.log("Inicio de sesión de usuario " + user);
                }
                else{
                    res.send("logout");
                    console.log("Error de inicio de sesión, usuario " + user);
                }
            }
        })
    })
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});
