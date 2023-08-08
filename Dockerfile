# Check out https://hub.docker.com/_/node to select a new base image
FROM node:16-slim

# Set to root user
USER root

# Install necessary build tools
RUN apt-get update
RUN apt-get install -y make gcc g++

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/user_ms

WORKDIR /home/node/user_ms

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./

RUN npm install

# Bundle app source code
COPY --chown=node . .

RUN npm run build

# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3000

EXPOSE ${PORT}
CMD [ "node", "." ]
