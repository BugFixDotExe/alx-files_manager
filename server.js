import router from './routes/index';

const express = require('express');

const app = express();
app.use(express.json()); // Responsible for populating the req.body with incoming POST payload
const port = process.env.PORT || 5000;

app.use('/', router);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
