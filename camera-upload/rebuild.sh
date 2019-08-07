#!/bin/bash

sleep 10 

docker kill cameraupload
docker rm cameraupload
docker run --name cameraupload --privileged -d \
    --restart always \
    -e pi_ip=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}') \
    -e AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
    -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
    -e HACKATHON_DEVICE=${HACKATHON_DEVICE} \
    -e TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID} \
    -e TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN} \
    -e SMS_NUMBER=${SMS_NUMBER} \
    -e SMS_FROM=${SMS_FROM} \
    entmike/hackathon-cameraupload:latest

