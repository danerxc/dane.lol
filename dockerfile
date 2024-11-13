# Use an official Node.js runtime as the base image
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if it exists) for dependency installation
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port your app runs on (ensure this matches your server's port)
EXPOSE 3000

# Define the command to run your app
CMD [ "node", "server.js" ]
