# IP Hackathon Monitoring Web Application

## Overview

A web application that displays images taken from an IoT device such as a Raspberry Pi, or a photo captured from a mobile device. The application will return metadata such as bounding box and objects detected via AWS Rekognition and the confidences given.

## Running in Docker

The easiest way to run this web application is in Docker. The following enviornment variables must be set in order for the application to read the images and metadata from AWS:

| Environment variable    | Descripton                 |
| ----------------------- | -------------------------- |
| `AWS_ACCESS_KEY`        | Your AWS Access Key        |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key |
| `AWS_BUCKET`            | Your AWS S3 bucket name    |

### Simple Example

```bash
docker run -p 80:80 --name monitor \
   -e AWS_ACCESS_KEY=YOURAWSACCESSKEY \
   -e AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey \
   -e AWS_BUCKET=your-s3-bucket-name \
   entmike/ip-hackathon-monitor:hackathon
```

### Behind a Corporate Proxy:

```bash
docker run -p 80:80 --name phoneupload \
   -e AWS_ACCESS_KEY=YOURAWSACCESSKEY \
   -e AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey \
   -e AWS_BUCKET=your-s3-bucket-name \
   -e http_proxy=http://username:password@proxy.example.com \
   -e https_proxy=https://username:password@proxy.example.com \
   entmike/ip-hackathon-monitor:hackathon
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
