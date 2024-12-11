import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.redisClientConnection = createClient();
    this.redisClientConnection.on('error', (error) => {
      console.error('Redis error:', error);
    });
  }

  isAlive() {
    try {
      this.redisClientConnection.ping();
      return true;
    } catch (err) {
      console.error('Redis is not alive:', err);
      return false;
    }
  }

  async get(key) {
    try {
      const fetchedData = await this.redisClientConnection.get(key);
      console.log(`Fetched data ${JSON.parse(fetchedData)}`);
      return fetchedData ? JSON.parse(fetchedData) : null;
    } catch (err) {
      console.error('Error fetching data from Redis:', err);
      return null;
    }
  }

  async set(key, incomingData, duration) {
    try {
      await this.redisClientConnection.set(key, incomingData, 'EX', duration);
    } catch (err) {
      console.error('Error setting data in Redis:', err);
    }
  }

  async del(key) {
    try {
      await this.redisClientConnection.del(key);
      console.log(`Data deleted for key: ${key}`);
    } catch (err) {
      console.error('Error deleting data from Redis:', err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
