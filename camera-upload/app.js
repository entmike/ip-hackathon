require('dotenv').config();
// Load the SDK and UUID
const AWS = require('aws-sdk');
AWS.config.update({ region : process.env.region || 'us-east-1' });
const fs = require('fs');
let lastSent = {};
const {
  performance
} = require('perf_hooks');
// Create an S3 client
let s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
let rekognition = new AWS.Rekognition({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Upload file to S3 bucket
let bucketName = process.env.bucket || 'ip-hackathon';
let device = process.env.HACKATHON_DEVICE || 'UNTITLED';
let keyName = device + '.jpg';
let metaName = device + '-metadata.json';
let t0=null, t1=null;
let rekogMeta = null;
let imageData = null;
let found = [];
let now = new Date().getTime();
// Measure performance
t0 = performance.now();
new Promise((resolve,reject)=>{
  fs.readFile('/app/image.jpg', (err, data)=> {
    if(err) return reject(err);
    t0 = performance.now();
    resolve(data);
  });
}).then(data=>{
  imageData = data;
  return new Promise((resolve,reject)=>{
    s3.putObject({
      Bucket: bucketName,
      Key: keyName,
      Body: data
    }, function(err, data) {
      if(err) return reject(err);
      resolve(data);
    });
  });
}).then(data=>{
  t1 = performance.now();
  console.log(`Successfully uploaded data to ${bucketName}/${keyName} (${(t1 - t0)}ms)`);
  return new Promise((resolve,reject)=>{
    rekognition.detectLabels({
      Image : {
        S3Object : { Bucket: bucketName, Name : keyName }
      }
    }, function (err, data) {
    if (err) return reject(err);
    resolve(data);
    });
  });
}).then(data=>{
  rekogMeta = data;
  return new Promise((resolve,reject)=>{
    s3.putObject({
      Bucket: bucketName,
      Key: metaName,
      Body: JSON.stringify({
        timestamp : Date.now(),
        duration : (t1 - t0),
        ip : process.env.pi_ip || "Unknown IP Address",
        rekognition : data
      },null,2)
    }, function(err, data) {
      if(err) return reject(err);
      resolve(data);
    });
  });
}).then(data=>{
  let meta = data;
  console.log(meta);
  if(rekogMeta.Labels){
    console.log("Inspecting Labels...");
    for (label of rekogMeta.Labels){
      let obj = label.Name;
      for(notify of `Reptile,Scissors,Weapon,Weaponary,Fire,Flame`.split(",")){
        if(obj==notify) found.push(obj);
      }
    }
  }
  if(process.env.TWILIO_ACCOUNT_SID && found.length >0 ){
    return s3.putObject({
      Bucket: bucketName,
      Key: "alerts/" + device + "-" + now + ".jpg",
      Body: imageData
    }).promise();
  }else{
    return Promise.resolve(null);
  }
}).then(data => {
  if(data==null) return Promise.resolve(null);
  const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    let promises=[];
    let numbers = process.env.SMS_NUMBER.split(",");
    for(number of numbers){
      lastSent[number] = lastSent[number] || {
        lastSent : 0
      };
      
      if ((now - lastSent[number].lastSent) / 1000 > 30){
        console.log(`Sending SMS to ${number}`);
        lastSent[number].lastSent = new Date().getTime();
        let msg = "The following items were detected: " + found.join(",");
        promises.push(client.messages.create({
          body: msg,
          from: process.env.SMS_FROM,
          mediaUrl : ['http://hackathon.howles.cloud/backend/alerts/' + device + "-" + now],
          to: number
        }));
      }
    }
    return Promise.all(promises);
  // console.log(message)
}).then(data=>{
  console.log("Done");
})
.catch(err=>{
  console.error(err);
});

