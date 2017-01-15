var express = require('express');
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


app.set('port', (process.env.PORT || 5000));

app.post('/login', function (req, res) {
    var user = req.body.usuario;
    var pass = req.body.clave;
    pg.connect(process.env.DATABASE_URL, function(err, client, done){
        client.query({
            text: "SELECT * FROM comprobar_usuario($1,$2);",
            values:[user, pass]
        }, function(err, result){
            done();
            if (err){
                console.log(err);
                res.send("err");
            }
            else{
                var logueado = result[0];
                console.log(result[0]);
                if (logueado == "1") res.send('errLog');
                else res.send('ok');
            }
        })
    })
});

app.listen(app.get('port'), function() {
    console.log('Backend escuchando en puerto ', app.get('port'));
});
