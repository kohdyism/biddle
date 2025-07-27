# Use official Bun base image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN bun install

# Expose port
EXPOSE 10998

# Run your app
CMD ["bun","run", "index.js"]
