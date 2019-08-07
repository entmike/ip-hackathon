#!/bin/bash

while true;
do

    # export pi_ip=`ip -4 addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'`
    raspistill -t 500 -q 10 -w 800 -h 600 -th none -o /app/image.jpg
    node app.js
    sleep .1

done
