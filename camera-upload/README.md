# IP Hackathon Camera Upload Application

## Overview

An application that is intended to run on a Raspberry Pi device that has a Rasberry Pi camera installed. The application runs `raspistill` to capture an image from the camera. Then, a simple Node app is executed to place the image into an AWS S3 Bucket for storage. Next, AWS Rekognition reads the stored image and returns the JSON results containing image features detected. This JSON is also stored in the same S3 Bucket. Finally, the Node app evaluates the JSON results, and if certain key word are found, and a Twilio key has been supplied, will issue an SMS alert to any phone numbers supplied.

## Running in Docker

The easiest way to run this web application is in Docker. The following enviornment variables must be set in order for the application to read the images and metadata from AWS:

### Required Variables

| Environment variable    | Descripton                       |
| ----------------------- | -------------------------------- |
| `AWS_ACCESS_KEY`        | Your AWS Access Key              |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key       |
| `AWS_BUCKET`            | Your AWS S3 bucket name          |
| `HACKATHON_DEVICE`      | Name of your Raspberry Pi Device |

### Optional Variables for SMS alerts

| Environment variable | Descripton                                                  |
| -------------------- | ----------------------------------------------------------- |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account ID                                      |
| `TWILIO_AUTH_TOKEN`  | Your Twilio Auth Token                                      |
| `SMS_NUMBER`         | Comma-delimited list of phone numbers to send SMS alerts to |
| `SMS_FROM`           | Your sender SMS phone number                                |

### Simple Example

```bash
docker run -p 80:80 --rm --name monitor \
   -e AWS_ACCESS_KEY=YOURAWSACCESSKEY \
   -e AWS_SECRET_ACCESS_KEY=YourAWSSecretAccessKey \
   -e AWS_BUCKET=your-s3-bucket-name \
   entmike/ip-hackathon-monitor
```

### Behind a Corporate Proxy:

```bash
docker run -p 80:80 --rm --name phoneupload \
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
