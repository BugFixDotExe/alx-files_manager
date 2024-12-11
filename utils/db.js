const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT, 10) || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.isConnected = false;
    this.client = new MongoClient(`mongodb://${host}:${port}/${database}`);
    this.client.connect().then(() => { this.isConnected = true; }).catch(() => this.isConnected);
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    if (this.isAlive()) {
      const dataBase = await this.client.db();
      const count = await dataBase.collection('users').countDocuments();
      return count;
    }
    return 0;
  }

  async nbFiles() {
    if (this.isAlive()) {
      const dataBase = await this.client.db();
      const count = await dataBase.collection('files').countDocuments();
      return count;
    }
    return 0;
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
