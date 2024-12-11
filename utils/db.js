const { MongoClient } = require('mongodb');
require('dotenv').config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost'
    const port = process.env.DB_PORT || 27017
    const database = process.env.DB_DATABASE || 'files_manager'
    this.dbClient = new MongoClient(`mongodb+srv://${host}:${port}/${database}`);
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
