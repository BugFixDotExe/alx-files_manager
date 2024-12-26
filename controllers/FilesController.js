import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb').ObjectId;
const uuid = require('uuid');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config();

class FilesController {
  static async postUpload(req, res) {
    const validTypes = ['folder', 'file', 'image'];
    const xTokenPayload = req.headers['x-token'];
    console.log(xTokenPayload);
    try {
      const isValidKey = `auth_${xTokenPayload}`;
      const fetchDataFromRedis = await redisClient.get(isValidKey);
      const userCollection = await dbClient.client.db().collection('users');
      const isUser = await userCollection.findOne({ _id: ObjectId(fetchDataFromRedis) });
      const userId = isUser._id;
      let { parentId, isPublic } = req.body;
      const { name, data, type } = req.body;
      if (!parentId) { parentId = 0; }
      if (!isPublic) { isPublic = false; }
      if (!name) { return res.status(400).json({ error: 'Missing name' }); }
      if (!validTypes.includes(type)) { return res.status(400).json({ error: 'Missing type' }); }
      if (!data && type !== 'folder') { return res.status(400).json({ error: 'Missing data' }); }

      if (type === 'folder') {
        try {
          const filesCollection = await dbClient.client.db().collection('files');
          const savedFile = await filesCollection.insertOne(
            {
              userId, name, type, isPublic, parentId,
            },
          );
          const savedPayload = savedFile.ops[0];
          res.status(201).json(savedPayload);
        } catch (err) { console.log(err); return res.status(400).json({ error: err }); }
      }
      if (type === 'file' || type === 'image') {
        const filesCollection = await dbClient.client.db().collection('files');
        const folder = process.env.FOLDER_PATH || '/tmp/files_manager';

        try {
          if (!fs.existsSync(folder)) { fs.mkdirSync(folder); }
        } catch (err) { console.log('From creating a dir: ', err); }

        const localPath = uuid.v4();
        const cleanData = Buffer.from(data, 'base64').toString('utf8');
        const absolutePath = path.join(folder, localPath);

        fs.writeFile(absolutePath, cleanData, (err) => {
          if (err) { console.log(err); }
        });
        const savedFile = await filesCollection.insertOne(
          {
            userId, name, type, isPublic, parentId, localPath: absolutePath,
          },
        );
        const savedPayload = savedFile.ops[0];
        res.status(201).json(savedPayload);
      }
    } catch (error) { console.log(error); return res.status(401).json({ error: 'Unauthorized' }); }
  }
}
export default FilesController;
