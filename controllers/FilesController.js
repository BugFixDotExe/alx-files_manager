import AuthController from './AuthController'


class FilesController { 
  static async postUpload(req, res) => {
  try {
    await AuthController.getConnect(req, res)
  } catch (error) { }
  const { name, type, data, parentId, isPublic } = req.body;
  if (!name) { return res.status(400).json({error: 'Missing name'})}
  if (!type) { return res.status(400).json({error: 'Missing type'})}
  
  
}
