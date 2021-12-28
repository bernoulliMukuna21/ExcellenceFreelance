var mongoose = require('mongoose');
var DB_connection = require('../bin/database-connection-cache');

let BookingSchema = new mongoose.Schema({
    bookingID: String,
    bookingType: {
      type: String
    },
    customer: {
        uuid: String,
        name: String
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
    },
    dueDateTime: {
        type: Date
    },
    price: {
        type: String
    },
    requestedPrice:{
        type: String
    },
    status: {
        type: String,
        default: 'awaiting acceptance'
    },
    completion: {
        status: String,
        date: Date
    },
    paid:{
        type: Boolean,
        default: false
    }
});


let BookingModel = DB_connection.EF_DB_conn.excellence_freelanceDB.model('BookingModel', BookingSchema);
module.exports = BookingModel;
