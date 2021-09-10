var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var DB_connection = require('../bin/database-connection-cache');

let UserSchema = new mongoose.Schema({
    name:{
        type: String,
    },
    surname:{
        type: String,
    },
    email:{
        type: String,
        unique: true
    },
    password:{
        type: String,
    },
    gender: String,
    phone_number: String,
    profile_picture: {
        name: String,
        contentType: String,
        data: Buffer
    },
    authentication:{
        authName: String,
        authID: String
    },
    serviceAndPrice:[{
        service: String,
        price: String
    }],
    description: String,
    skill:[{type: String}],
    education:[{
        institute: String,
        degreeAndCourse: String,
        educationYear: String
    }],
    portfolio:[{
        pictureURL: String,
        date:{
            type: Date,
            default: Date.now()
        }
    }],
    date:{
        type: Date,
        default: Date.now()
    },
    user_stature: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

UserSchema.pre('save', function (next) {
    let user = this;
    let salt_factor = 15;
    if(!user.isModified('password')) return next();

    bcrypt.genSalt(15, (err, salt) => bcrypt.hash(user.password, salt, (err, hash)=>{
        if(err)  next(err);
        user.password = hash;
        next();
    }));
});

UserSchema.methods.comparePassword = function(candidatePassword, cb){

    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch)
    });
};


let UserModel = DB_connection.EF_DB_conn.excellence_freelanceDB.model('UserModel', UserSchema);
module.exports = UserModel;
