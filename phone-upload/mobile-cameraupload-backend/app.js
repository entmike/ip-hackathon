require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.BACKENDPORT || 3000;
const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.region || "us-east-1" });

let required = `AWS_ACCESS_KEY,AWS_SECRET_ACCESS_KEY,AWS_BUCKET`.split(',');
let missing = []
required.map(req => {
    if (!process.env[req]) {
        missing.push(req);
    }
})
if (missing.length > 0) {
    return console.log(`Missing the following environment variables:\n${missing}`)
}
let accessKeyId = process.env.AWS_ACCESS_KEY;
let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
let bucket = process.env.AWS_BUCKET;

app.set('trust proxy', true);

app.use('/upload', require('./services/upload')({
    AWS_ACCESS_KEY: accessKeyId,
    AWS_SECRET_ACCESS_KEY: secretAccessKey,
    bucket: bucket
}));

app.listen(port, () => console.log(`Upload API listening on port ${port}!`));
