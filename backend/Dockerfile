# Use the official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Set environment variable for production
ENV NODE_ENV=production

# Fly sets the PORT dynamically
ENV PORT=8080
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
