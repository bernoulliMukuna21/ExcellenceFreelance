require('dotenv').config();
var EF_DB_conn = {};

/*
* The following codes are for setting up the connection
* to MongoDB (cloud and local)
* */
var mongoose = require('mongoose');

let connection_URI = process.env.remote_MongoURI;// Remote mongoDB connection

/* Local mongoDB connection*/

//let database_name = '/excellence_freelance';
//let connection_URI = process.env.local_connectionURI+database_name;


let connection_Options = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
    useUnifiedTopology: true
}

EF_DB_conn.excellence_freelanceDB = mongoose.createConnection(connection_URI, connection_Options);
console.log('Mongo Connection Established!');


/*
* The following lines of codes is dealing with the connection to redis.
* As well as the connection to redis, we are introducing the idea of
* caching data with redis
* */
/*
const util = require('util');
var redis = require('redis');
var REDIS_PORT = process.env.PORT || 6379;
var client = redis.createClient(REDIS_PORT);


client.on('connect', function() {
    console.log('Redis client connected');
});
client.on('error', function (err) {
    console.log('Connection Failed!' + err);
});

client.hget = util.promisify(client.hget);

// create reference for .exec
const exec = mongoose.Query.prototype.exec;

// create new cache function on prototype
mongoose.Query.prototype.cache = function(options = { expire: 60 }) {
    this.useCache = true;
    this.expire = options.expire;
    this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

    return this;
}

// override exec function to first check cache for data
mongoose.Query.prototype.exec = async function() {
    if (!this.useCache) {
        return await exec.apply(this, arguments);
    }

    const key = JSON.stringify({
        ...this.getQuery(),
        collection: this.mongooseCollection.name
    });

    // get cached value from redis
    const cacheValue = await client.hget(this.hashKey, key);

    // if cache value is not found, fetch data from mongodb and cache it
    if (!cacheValue) {
        const result = await exec.apply(this, arguments);
        client.hset(this.hashKey, key, JSON.stringify(result));
        client.expire(this.hashKey, this.expire);

        console.log('Return data from MongoDB');
        return result;
    }

    // return found cachedValue
    const doc = JSON.parse(cacheValue);
    console.log('Return data from Redis');
    return Array.isArray(doc)
        ? doc.map(d => new this.model(d))
        : new this.model(doc);
}
*/
/*
* export the essentials for saving and retrieving data to/from mongodb and redis
* */
module.exports = {
    EF_DB_conn
    //client,
    /*clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }*/
};