FROM node:8-slim
LABEL Maintainer="Mike Howles <mike.howles@gmail.com>"
# Install nginx to handle backend and frontend apps
RUN apt-get update && apt-get install -y nginx
# Configure nginx and startup
COPY ./docker-files/server.conf /etc/nginx/conf.d/default.conf
COPY ./docker-files/timeout.conf /etc/nginx/conf.d/timeout.conf
# Install Vue CLI
RUN npm i -g @vue/cli
# Copy files
COPY ./mobile-cameraupload /app/frontend
COPY ./mobile-cameraupload-backend /app/backend
# Delete any node_modules for binary build diffs
RUN rm -Rf /app/backend/node_modules
# Install Backend and Frontend
ENV VUE_APP_HACKATHON_BACKEND=/backend
RUN cd /app/backend && npm i && \
    cd /app/frontend && npm i && npm run build
# Run Startup Script
WORKDIR /app
ENV BACKENDPORT=3000
COPY ./docker-files/startup.sh /app/startup.sh
CMD ./startup.sh