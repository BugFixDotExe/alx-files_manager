import dbClient from '../utils/db';

const crypto = require('crypto');

function hashPassword(password) {
  return new Promise((resolve) => {
    const iterations = 10000;
    const hashBytes = 64;
    const digest = 'SHA1';
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, iterations, hashBytes, digest, (err, key) => {
      if (err) { throw err; }
      resolve(key.toString('hex'));
    });
  });
}

class UsersController {
  static async postNew(req, res) {
    let isLive = false;
    do {
      isLive = dbClient.isAlive();
    } while (isLive !== true);

    try {
      console.log(dbClient);
      const { email, password } = req.body;
      if (!email) { return res.status(400).json({ error: 'Missing email' }); }
      if (!password) { return res.status(400).json({ error: 'Missing password' }); }
      const userCollection = await dbClient.client.db().collection('users');
      const isUser = await userCollection.findOne({ email });
      if (isUser) { return res.status(400).json({ error: 'Already exist' }); }
      const hashedPassword = hashPassword(password);
      hashedPassword.then(async (key) => {
        const savedUser = await userCollection.insertOne({ email: `${email}`, password: `${key}` });
        if (savedUser) {
          res.status(200).json({ email: savedUser.ops[0].email, id: savedUser.insertedId });
        }
      });
    } catch (err) {
      console.log(err);
      res.json(err.message);
    }
    return null;
  }
}
export default UsersController;
