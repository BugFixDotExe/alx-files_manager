import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const getStatus = ((req, res) => {
  if (redisClient.isAlive() && dbClient.isAlive()) {
    res.status(200).json({ redis: true, db: true });
  }
});

async function getStats(req, res) {
  const nbUsersCount = await dbClient.nbUsers();
  const filesCount = await dbClient.nbFiles();
  res.status(200).json({ users: nbUsersCount, files: filesCount });
}

module.exports = {
  getStatus,
  getStats,
};
