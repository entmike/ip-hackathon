#!/bin/sh
echo "Starting Nginx..."
mkdir -p /run/nginx
rm /etc/nginx/sites-enabled/default
nginx

echo "Starting backend..."
cd /app/backend
npm run prod