var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.get('/', function (request, response) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
        client.query("SELECT * FROM comprobar_usuario('eze','1234')", function(err, result) {
            done();
            if (err)
            {
                console.error(err);
                response.send("Error " + err);
            }
            else
            {
                var resultado = result[0][0];
                response.send(resultado);
            }
        });
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
