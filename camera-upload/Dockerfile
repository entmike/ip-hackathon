FROM resin/rpi-raspbian:jessie

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install -y wget libraspberrypi-bin iproute2
RUN usermod -a -G video root

WORKDIR /usr/src/app

RUN curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
RUN sudo apt install nodejs
WORKDIR /app
COPY ./node_modules ./node_modules
COPY ./run.sh ./run.sh
COPY ./package* ./
COPY ./app.js ./app.js

# RUN npm i
CMD ["/bin/bash", "run.sh"]
