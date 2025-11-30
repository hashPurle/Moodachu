# Use Node.js for building
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for frontend
# We copy to a subdirectory to match the repo structure if needed, 
# or just to /app/frontend if we want to build there.
COPY frontend/package*.json ./frontend/

# Install dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy the entire repository to /app
# This ensures ../shared and ../contract are available
WORKDIR /app
COPY . .

# Build the app
WORKDIR /app/frontend
RUN npm run build

# Use Nginx for serving
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
