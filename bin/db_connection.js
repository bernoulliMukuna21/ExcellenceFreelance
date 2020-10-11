var mongoose = require('mongoose');
require('dotenv').config();
var EF_DB_conn = {};

let connection_URI = process.env.remote_MongoURI;// Remote mongoDB connection

/* Local mongoDB connection
let database_name = '/excellence_freelance';
let connection_URI = process.env.local_connectionURI+database_name;
 */

let connection_Options = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}

EF_DB_conn.excellence_freelanceDB = mongoose.createConnection(connection_URI, connection_Options);
console.log('Mongo Connection Established!');
module.exports = EF_DB_conn;