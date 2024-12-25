import UsersController from './UsersController';
import dbClient from '../utils/db';
import redisClient from '../utils/redis'

const uuid = require('uuid');

class AuthController {
  static async getConnect(req, res) {
    // This method plays the role of decoding the encoded.
    const authorizationHeader = req.headers.authorization
    const authKeyPayload = authorizationHeader.split(' ')[1]
    const originalPayloadUnencoded = Buffer.from(authKeyPayload, 'base64').toString('utf8')
    const [email, password] = originalPayloadUnencoded.split(':')
    const userCollection = await dbClient.client.db().collection('users');
    const isUser = await userCollection.findOne({ email });
    if (!isUser) { return res.status(401).json({ error: 'Unauthorized' }); }

    const hashedVariant = UsersController.hashPassword(password);
    hashedVariant.then(async (key) => {
      if (key !== isUser.password) { return res.status(401).json({ error: 'Unauthorized' }); }
      const token = uuid.v4()
      const authKey = `auth_${token}`
      try {
        await redisClient.set(authKey, isUser._id, 86400);
        res.status(200).json({ token });
      } catch (err) { console.log(err); }
      return null;
    })
    return null;
  }

  static async getDisconnect(req, res) {
    const xTokenPayload = req.headers['x-token']
    const isValidKey = `auth_${xTokenPayload}`
    try {
      await redisClient.del(isValidKey)
      res.status(204).json({})
    } catch (err) { return res.status(401).json({ error: 'Unauthorized' }); }
    return null;
  }
}
export default AuthController;
