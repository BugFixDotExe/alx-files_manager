import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();

    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  static async getStats(req, res) {
    const userCount = await dbClient.nbUsers();
    const fileCount = await dbClient.nbFiles();

    res.status(200).json({ users: userCount, files: fileCount });
  }
}

export default AppController;
