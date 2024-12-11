const { MongoClient } = require('mongodb');
require('dotenv').config();

class DBClient {
  constructor() {
    const client = new MongoClient(`mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`);
    this.dbClient = client;
  }

  isAlive() {
    if (!this.dbClient.isConnected()) {
      return this.dbClient
        .connect()
        .then(() => true).catch(() => false);
    }
    return true;
  }

  async nbUsers() {
    if (this.isAlive()) {
      try {
        return this.dbClient.users.count();
      } catch (error) {
        console.log(error);
      }
    }
    return false;
  }

  async nbFiles() {
    if (this.isAlive()) {
      try {
        return this.dbClient.files.count();
      } catch (error) {
        console.log(error);
      }
    }
    return false;
  }
}

const dbClient = new DBClient();
export default dbClient;
