# Development stage
FROM node:18-alpine AS development

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

COPY src ./src

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm install --production

COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]