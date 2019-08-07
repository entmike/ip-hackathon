require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.BACKENDPORT || 3000;
const AWS = require('aws-sdk');
const sharp = require('sharp');

AWS.config.update({ region : process.env.region || 'us-east-1' });

let accessKeyId = process.env.AWS_ACCESS_KEY;
let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
let bucket = process.env.AWS_BUCKET;

/**
 * List URL
 */
app.get('/list', cors(), (req,res)=>{
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    s3.listObjectsV2 ({ Bucket : bucket, Delimiter : "/" })
    .promise()
    .then(data => {
        // Read Bucket List
        let files = data.Contents;
        let images = {};
        let promises = [];
        for(file of files){
            let arr = file.Key.split('.');
            let ext = arr[arr.length-1];
            if(ext=='jpg') {
                images[arr[0]]={
                    name : arr[0]
                };
                promises.push(s3.getObject({ Bucket : bucket, Key : arr[0] + "-metadata.json" }).promise().then(data=>{
                    images[arr[0]].data = data;
                    return images[arr[0]];
                }))
            }
        }
        return Promise.all(promises);
    }).then(data=>{
        // Get JSON Metadata
        let meta = [];
        data.map(file=>{
            meta.push({
                name : file.name,
                metadata : JSON.parse(file.data.Body.toString())
            });
        });
        res.end(JSON.stringify(meta, null, 2));
    }).catch(err=>{
        res.status(500);
        res.end(err.msg);
    });
});

/**
 * Get Camera Image
 */
app.get('/cameras/:device/:width?/:height?', (req,res)=>{
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    s3.getObject({ Bucket : bucket, Key : req.params.device + ".jpg" }).promise()
    .then(data=>{
        if(data && data.Body){
            let file = new Buffer(data.Body);
            if(req.params.width && req.params.height){
                return sharp(file).resize(parseInt(req.params.width), parseInt(req.params.height)).toBuffer();
            }else{
                return Promise.resolve(data.Body);
            }
        }else{
            res.end("Error");
        }
    })
    .then(data=>{
        res.end(data);
    })
    .catch(err=>{
        res.status(500);
        res.end(`An Error Occured:
        ${err}`);
    })
});
/**
 * Get Camera Image
 */
app.get('/alerts/:device/:width?/:height?', (req,res)=>{
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    s3.getObject({ Bucket : bucket, Key : 'alerts/' + req.params.device + ".jpg" }).promise()
    .then(data=>{
        if(data && data.Body){
            let file = new Buffer(data.Body);
            if(req.params.width && req.params.height){
                return sharp(file).resize(parseInt(req.params.width), parseInt(req.params.height)).toBuffer();
            }else{
                return Promise.resolve(data.Body);
            }
        }else{
            res.end("Error");
        }
    })
    .then(data=>{
        res.end(data);
    })
    .catch(err=>{
        res.status(500);
        res.end(`An Error Occured:
        ${err}`);
    })
});
/**
 * Get Camera Image
 */
app.get('/focuscameras/:device/:width?/:height?', (req,res)=>{
    let metadata = null;
    let imageMetadata = null;
    let promises = [];
    let blurred = null;
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    Promise.all([
        s3.getObject({ Bucket : bucket, Key : req.params.device + ".jpg" }).promise(),
        s3.getObject({ Bucket : bucket, Key : req.params.device + "-metadata.json" }).promise()
    ])
    .then(files=>{
        let data = files[0];
        metadata = JSON.parse(files[1].Body);
        if(data && data.Body){
            return Promise.all([
                Promise.resolve(sharp(new Buffer(data.Body)).greyscale().blur(15)),
                Promise.resolve(sharp(new Buffer(data.Body))),
                sharp(new Buffer(data.Body)).metadata()
            ]);
        }else{
            throw("Error");
        }
    })
    .then(data=>{
        blurred = data[0];
        let original = data[1];
        imageMetadata = {
            width : data[2].width,
            height : data[2].height,
            channels : data[2].channels
        };
        let labels = metadata.rekognition.Labels;
        let crops = [];
        for(label of labels){
            for(instance of label.Instances){
                let coords = {
                    left : parseInt(imageMetadata.width * instance.BoundingBox.Left),
                    top : parseInt(imageMetadata.height * instance.BoundingBox.Top),
                    width : parseInt(imageMetadata.width * instance.BoundingBox.Width),
                    height : parseInt(imageMetadata.height * instance.BoundingBox.Height)
                }
                let crop = original.extract(coords);
                crops.push(crop.toBuffer());
                coords.crop = crop;
                promises.push(coords);
            }
        }
        return Promise.all(crops);
    }).then(crops=>{
        let composite = [];
        for(var i = 0;i< crops.length; i++){
            composite.push({
                input : crops[i],
                left : promises[i].left,
                top : promises[i].top
            })
        }
        blurred.composite(composite);
        return Promise.resolve(blurred);
    }).then(sharpObj=>{
        return sharpObj.toBuffer();        
    }).then(buffer=>{
        if(req.params.width && req.params.height){
            return sharp(buffer).resize(parseInt(req.params.width), parseInt(req.params.height)).toBuffer();
        }else{
            return Promise.resolve(buffer);
        }
    })
    .then(buffer=>{
        res.end(buffer);
    })
    .catch(err=>{
        res.status(500);
        res.end(`An Error Occured:
        ${err}`);
    })
});

app.get('/metadata/:device', (req,res)=>{
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    s3.getObject({ Bucket : bucket, Key : req.params.device + "-metadata.json" }).promise()
    .then(data=>{
        if(data && data.Body){
            let file = new Buffer(data.Body);
            res.end(file);
        }else{
            res.end("Error");
        }
    })
    .catch(err=>{
        res.status(500);
        res.end(`An Error Occured:
        ${err}`);
    })
});

app.get('/stats/:device', (req,res)=>{
    // Create an S3 client
    let s3 = new AWS.S3({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    });
    s3.getObject({ Bucket : bucket, Key : req.params.device + "-stats.json" }).promise()
    .then(data=>{
        if(data && data.Body){
            let file = new Buffer(data.Body);
            res.end(file);
        }else{
            res.end("Error");
        }
    })
    .catch(err=>{
        res.status(500);
        res.end(`An Error Occured:
        ${err}`);
    })
});

app.listen(port, () => console.log(`Camera Monitor API listening on port ${port}!`));