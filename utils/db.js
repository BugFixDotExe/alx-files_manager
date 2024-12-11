const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT, Number) || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const uri = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(uri);
  }

  isAlive() {
    const isConnected = new Promise((resolve) => {
      try {
        this.client.connect().then(() => true);
        resolve();
      } catch (err) { return false; }
    })
    if (!isConnected) { return false; }
    return true;
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
