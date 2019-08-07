#!/bin/bash

sleep 20

docker run --name cameraupload --privileged \
--restart always \
-e pi_ip=$(ip -4 addr show wlan0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
-e AWS_ACCESS_KEY=${AWS_ACCESS_KEY} \
-e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
-e HACKATHON_DEVICE=${HACKATHON_DEVICE} \
entmike/hackathon-cameraupload
