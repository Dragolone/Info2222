#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}    Starting Secure HTTPS Development Server    ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "mkcert is not installed. Installing with Homebrew..."
    brew install mkcert
fi

# Ensure certificates directory exists
if [ ! -d "./certs" ]; then
    echo "Creating certificates directory..."
    mkdir -p certs
fi

# Check if certificates exist, if not create them
if [ ! -f "./certs/localhost+2.pem" ] || [ ! -f "./certs/localhost+2-key.pem" ]; then
    echo "Generating certificates for localhost..."
    cd certs && mkcert localhost 127.0.0.1 ::1 && cd ..
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Start the secure server
echo -e "${GREEN}Starting secure server...${NC}"
echo -e "${GREEN}Visit https://localhost:3001 in your browser${NC}"
node server.js
