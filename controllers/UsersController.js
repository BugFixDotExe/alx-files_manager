import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const crypto = require('crypto');
const { ObjectId } = require('mongodb').ObjectId;

class UsersController {
  static hashPassword(password) {
    return new Promise((resolve, reject) => {
      try {
        const hash = 'SHA1';
        // const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto.createHash(hash).update(password).digest('hex');
        resolve(hashedPassword);
      } catch (err) { reject(err); }
    });
  }

  static async postNew(req, res) {
    let isLive = false;
    do {
      isLive = dbClient.isAlive();
    } while (isLive !== true);

    try {
      const { email, password } = req.body;
      if (!email) { return res.status(400).json({ error: 'Missing email' }); }
      if (!password) { return res.status(400).json({ error: 'Missing password' }); }
      const userCollection = await dbClient.client.db().collection('users');
      const isUser = await userCollection.findOne({ email });
      if (isUser) { return res.status(400).json({ error: 'Already exist' }); }
      const hashedPassword = UsersController.hashPassword(password);
      hashedPassword.then(async (key) => {
        const savedUser = await userCollection.insertOne({ email: `${email}`, password: `${key}` });
        if (savedUser) {
          res.status(200).json({ email: savedUser.ops[0].email, id: savedUser.insertedId });
        }
      });
    } catch (err) {
      res.json(err.message);
    }
    return null;
  }

  static async getMe(req, res) {
    let isLive = false;
    const userToken = req.headers['x-token'];
    const authKey = `auth_${userToken}`;
    const id = await redisClient.get(authKey);
    do {
      isLive = dbClient.isAlive();
    } while (isLive !== true);
    try {
      const userCollection = await dbClient.client.db().collection('users');
      const isUser = await userCollection.findOne({ _id: ObjectId(id) });
      res.status(200).json({ email: isUser.email, id: isUser._id });
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
    }
    return null;
  }
}
export default UsersController;
