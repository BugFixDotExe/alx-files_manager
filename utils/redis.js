import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.redisClientConnection = createClient();
    this.isConnected = false;

    this.redisClientConnection.on('error', (error) => {
      console.error('Redis error:', error);
    });

    this.redisClientConnection.on('ready', () => {
      this.isConnected = true;
      console.log('Redis is connected and ready to use');
    });

    this.redisClientConnection.connect().catch((error) => {
      console.error('Error connecting to Redis:', error);
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async get(key) {
    try {
      if (this.isAlive()) {
        const fetchedData = await this.redisClientConnection.get(key);
        return fetchedData ? JSON.parse(fetchedData) : null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching data from Redis:', err);
      return null;
    }
  }

  async set(key, incomingData, duration) {
    try {
      if (this.isAlive()) {
        await this.redisClientConnection.set(key, JSON.stringify(incomingData), {
          EX: duration,
        });
      }
    } catch (err) {
      console.error('Error setting data in Redis:', err);
    }
  }

  async del(key) {
    try {
      if (this.isAlive()) {
        await this.redisClientConnection.del(key);
      }
    } catch (err) {
      console.error('Error deleting data from Redis:', err);
    }
  }
}
const redisClient = new RedisClient();

export default redisClient;
