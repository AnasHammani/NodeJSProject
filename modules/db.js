const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;


const url = process.env.DB_URL;
const dbName = process.env.DB_DB;


/**
 * Connect to the database
 */
const connect = () => {
  return new Promise((resolve, reject) => {
      const client = new MongoClient(url, { useNewUrlParser: true });
      client.connect(function(err) {
          if (err) {
              console.log("[DB] Unable to connect to server: " + err.message);
              reject(err);
          } else {
              console.log("[DB] Connected successfully to server");
              exports.db = client.db(dbName);
              resolve(exports.db); 
          }
      });
  });
};


/**
* Ensure DB is in correct state for the Application
*/
const boot = () => {

}


/**
 * Exports
 */
exports.connect = connect;
exports.boot = boot;
exports.db = null; // db will be set after connected;
exports.ObjectID = mongodb.ObjectID;