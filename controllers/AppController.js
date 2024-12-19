import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    try {
      const redisStatus = redisClient.isAlive();
      const dbStatus = dbClient.isAlive();
      res.status(200).json({ redis: redisStatus, db: dbStatus });
    } catch (err) { res.status(401).json({ err }); }
    return null;
  }

  static async getStats(req, res) {
    try {
      const userCount = await dbClient.nbUsers();
      const fileCount = await dbClient.nbFiles();
      res.status(200).json({ users: userCount, files: fileCount });
    } catch (err) { res.json({ error: err }); }
    return null;
  }
}

export default AppController;
