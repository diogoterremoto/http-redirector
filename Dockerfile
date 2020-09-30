FROM node:10

WORKDIR /var/www/

# Install the application's dependencies into the node_modules's directory.
COPY ./app/package.json ./
COPY ./app/package-lock.json ./
RUN npm install

# Copy application
COPY ./app/ ./

# Default exposed port
EXPOSE 8080

# Copy and run entrypoint
COPY ./entrypoint.sh /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]
