# official node.js image from Docker Hub
FROM node:18 

# working directory inside the container
WORKDIR /usr/src/app

# copy package.json and package-lock.json to the working directory
COPY package*.json ./

# install the application dependencies
RUN npm install

# copy the rest of the application code to the working directory
COPY . .

# expose the port to run on
EXPOSE 3000

# command 'node server.js' to run application
CMD ["node", "server.js"]