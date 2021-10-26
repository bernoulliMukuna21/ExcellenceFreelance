var mongoose = require('mongoose');
var DB_connection = require('../bin/database-connection-cache');

let BookingSchema = new mongoose.Schema({
    bookingID: String,
    customer: {
        type: String
    },
    supplier: {
        uuid: String,
        name: String
    },
    service: {
        type: String
    },
    projectName: {
        type: String
    },
    projectDescription: {
        type: String
    },
    creationDate:{
        type: Date,
        default: Date.now()
    },
    dueDate: {
        type: Date
    },
    price: {
        type: String
    },
    status: {
        type: String,
        default: 'pending'
    }
});


let BookingModel = DB_connection.EF_DB_conn.excellence_freelanceDB.model('BookingModel', BookingSchema);
module.exports = BookingModel;
