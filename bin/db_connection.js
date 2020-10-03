var mongoose = require('mongoose');
require('dotenv').config();
var EF_DB_conn = {};

let connection_uri = process.env.local_connectionURI;
//let mongoURI = 'mongodb+srv://bernoulliMukuna21:reJ2YhAXrv6mhMW@stickler-zmx1n.mongodb.net/test?authSource=admin&replicaSet=Stickler-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true'

let database_name = '/excellence_freelance';
let connection_URI = connection_uri+database_name;
let connection_Options = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}

EF_DB_conn.excellence_freelanceDB = mongoose.createConnection(connection_URI, connection_Options)
console.log('Mongo Connection Established!')
module.exports = EF_DB_conn;