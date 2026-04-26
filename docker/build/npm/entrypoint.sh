#!/bin/bash

# Only install if node_modules is missing or package-lock changed
if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install --prefer-offline
fi

# start vite
npm run dev &

# trap SIGINT and SIGTERM signals and gracefully exit
trap "echo \"Killing the vite server\"; kill $!; exit" SIGINT SIGTERM

# wait until the vite server is stopped
wait $!
