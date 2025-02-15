import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb').ObjectId;
const uuid = require('uuid');
const fs = require('node:fs');
const path = require('node:path');
var mime = require('mime-types')
require('dotenv').config();

class FilesController {
  static async postUpload(req, res) {
    const validTypes = ['folder', 'file', 'image'];
    const xTokenPayload = req.headers['x-token'];

    try {
      const isValidKey = `auth_${xTokenPayload}`;
      const fetchDataFromRedis = await redisClient.get(isValidKey);
      if (!fetchDataFromRedis) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userCollection = await dbClient.client.db().collection('users');
      const isUser = await userCollection.findOne({ _id: ObjectId(fetchDataFromRedis) });
      if (!isUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = isUser._id;

      let { parentId, isPublic } = req.body;
      const { name, data, type } = req.body;

      if (!parentId) {
        parentId = 0;
      }
      if (!isPublic) {
        isPublic = false;
      }

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId !== 0) {
        const filesCollection = await dbClient.client.db().collection('files');
        const parentFile = await filesCollection.findOne({ _id: ObjectId(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      if (type === 'folder') {
        try {
          const filesCollection = await dbClient.client.db().collection('files');
          const savedFile = await filesCollection.insertOne({
            userId, name, type, isPublic, parentId,
          });
          const savedPayload = savedFile.ops[0];
          res.status(201).json(savedPayload);
        } catch (err) {
          console.log(err);
          return res.status(400).json({ error: err });
        }
      } else if (type === 'file' || type === 'image') {
        const filesCollection = await dbClient.client.db().collection('files');
        const folder = process.env.FOLDER_PATH || '/tmp/files_manager';

        try {
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
          }
        } catch (err) {
          console.log('From creating a dir: ', err);
        }

        const localPath = uuid.v4();
        const cleanData = Buffer.from(data, 'base64').toString('utf8');
        const absolutePath = path.join(folder, localPath);

        fs.writeFile(absolutePath, cleanData, (err) => {
          if (err) {
            console.log(err);
          }
        });

        const savedFile = await filesCollection.insertOne({
          userId, name, type, isPublic, parentId, localPath: absolutePath,
        });
        const savedPayload = savedFile.ops[0];
        res.status(201).json(savedPayload);
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getShow(req, res) {
    const xTokenPayload = req.headers['x-token'];
    const { id } = req.params;
    let isValidKey;
    try {
      isValidKey = await redisClient.get(`auth_${xTokenPayload}`)
      if (!isValidKey === null) { return res.status(401).json({ error: 'Unauthorized' }); }
      const filesCollection = await dbClient.client.db().collection('files');
      const fileObject = await filesCollection.findOne({ _id: ObjectId(id) });
      res.status(201).json(fileObject);
    } catch (err) { console.log(err); return res.status(401).json({ error: 'Unauthorized' }); }
  }

  static async getIndex(req, res) {
    const xTokenPayload = req.headers['x-token'];
    try {
      const isValidKey = await redisClient.get(`auth_${xTokenPayload}`)
      if (!isValidKey === null) { return res.status(401).json({ error: 'Unauthorized' }); }
    } catch (Err) { console.log(Err); }

    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page) || 0;
    try {
      const filesCollection = await dbClient.client.db().collection('files');
      const documents = await filesCollection.aggregate([
        { $match: { parentId } },
        { $skip: (page * 20) },
        { $limit: 20 }
      ]).toArray();

      if (documents === null) { return res.status(401).json({}); }
      console.log(documents)
      res.status(201).json({ page, limit: 20, documents });
    } catch (err) { console.log(err); }
  }

  static async putPublish(req, res) {
    const xTokenPayload = req.headers['x-token']
    const { id } = req.params;
    let isValidKey;

    try {
      isValidKey = await redisClient.get(`auth_${xTokenPayload}`)
      if (!isValidKey === null) { return res.status(401).json({ error: 'Unauthorized' }); }
    } catch (err) { console.log(err); }


    try {
      const filesCollection = await dbClient.client.db().collection('files');
      const userHasObject = await filesCollection.findOne({ userId: ObjectId(isValidKey) });
      if (!userHasObject) {
        return res.status(404).json({ error: 'Not found' });
      }

      const fileObject = await filesCollection.findOne({ _id: ObjectId(id) });
      if (fileObject.userId.toString() !== isValidKey || !fileObject) {
        return res.status(404).json({ error: 'Not found' });
      }

      await filesCollection.updateOne(
        { _id: ObjectId(fileObject._id) },
        { $set: { isPublic: true } }
      )
      res.status(200).json(fileObject);
    } catch (err) { console.log(err); }
  }

  static async putUnpublish(req, res) {
    const xTokenPayload = req.headers['x-token']
    const { id } = req.params;
    let isValidKey;

    try {
      isValidKey = await redisClient.get(`auth_${xTokenPayload}`)
      if (!isValidKey === null) { return res.status(401).json({ error: 'Unauthorized' }); }
    } catch (err) { console.log(err); }


    try {
      const filesCollection = await dbClient.client.db().collection('files');
      const userHasObject = await filesCollection.findOne({ userId: ObjectId(isValidKey) });
      if (!userHasObject) {
        return res.status(404).json({ error: 'Not found' });
      }

      const fileObject = await filesCollection.findOne({ _id: ObjectId(id) });
      if (fileObject.userId.toString() !== isValidKey || !fileObject) {
        return res.status(404).json({ error: 'Not found' });
      }

      await filesCollection.updateOne(
        { _id: ObjectId(fileObject._id) },
        { $set: { isPublic: false } }
      )
      res.status(200).json(fileObject);
    } catch (err) { console.log(err); }
  }

  static async getFile(req, res) {
    const xTokenPayload = req.headers['x-token']
    const { id } = req.params;
    let isValidKey;

    try {
      isValidKey = await redisClient.get(`auth_${xTokenPayload}`)
      if (!isValidKey === null) { return res.status(401).json({ error: 'Unauthorized' }); }
    } catch (err) { console.log(err); }


    try {
      const filesCollection = await dbClient.client.db().collection('files');
      const userHasObject = await filesCollection.findOne({ userId: ObjectId(isValidKey) });
      if (!userHasObject) {
        return res.status(404).json({ error: 'Not found' });
      }

      const fileObject = await filesCollection.findOne({ _id: ObjectId(id) });
      if (fileObject.userId.toString() !== isValidKey || !fileObject) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (fileObject.isPublic === false) { return res.status(404).json({ error: 'Not found' }); }
      if (fileObject.type === 'folder') { return res.status(400).json({ error: 'A folder doesn\'t have content' }); }
      const mimeType = mime.lookup(fileObject.name);
      // setting a custome header to the mime-type
      res.set('Content-Type', mimeType);
      res.status(200).json(fileObject)
    } catch (error) { console.log(error); }
  }
}

export default FilesController;
