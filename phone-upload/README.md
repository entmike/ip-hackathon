# IP Hackathon Phone Upload

## Overview

A web application that when accessed on a mobile device or computer with a web camera, will display a preview page containing a COCO-SSD Tensorflow model to provide realtime object detection. When a photo is taken, the backend will upload a photo to AWS for processing with AWS Rekognition.

## Running in Docker

The easiest way to run this web application is in Docker. The following enviornment variables must be set in order for the AWS backend processing to work properly:

| Environment variable    | Descripton                 |
| ----------------------- | -------------------------- |
| `AWS_ACCESS_KEY`        | Your AWS Access Key        |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |
| `AWS_BUCKET`            | Your AWS S3 bucket name    |

### Simple Example

```bash
docker run -p 80:80 --name phoneupload \
   -e AWS_ACCESS_KEY=YOURAWSACCESSKEY \
   -e AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey \
   -e AWS_BUCKET=your-s3-bucket-name \
   entmike/ip-hackathon-phone-upload
```

### Behind a Corporate Proxy:

```bash
docker run -p 80:80 --name phoneupload \
   -e AWS_ACCESS_KEY=YOURAWSACCESSKEY \
   -e AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey \
   -e AWS_BUCKET=your-s3-bucket-name \
   -e http_proxy=http://username:password@proxy.example.com \
   -e https_proxy=https://username:password@proxy.example.com \
   entmike/ip-hackathon-phone-upload
```

## Building Docker Image

To build the image yourself, use an example such as one described below to build your own Docker image.

### Regular Build

```bash
docker build -t your-image-name .
```

### Building Behind a Corporate Proxy

```bash
docker build -t your-image-name \
   --build-arg http_proxy=http://username:password@proxy.example.com:8080 \
   --build-arg https_proxy=https://username:password@proxy.example.com:8080 \
   .
```
