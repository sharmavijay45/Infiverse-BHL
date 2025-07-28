FROM node:18-slim

# Install system dependencies for browser monitoring and screenshots
RUN apt-get update && apt-get install -y \
    imagemagick \
    scrot \
    xdotool \
    wmctrl \
    x11-utils \
    xvfb \
    x11-xserver-utils \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
