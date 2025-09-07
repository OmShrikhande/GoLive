# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy all source
COPY . .

# Compile TypeScript -> dist/
RUN npm run build


# --- Runtime Stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only necessary runtime files
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Expose app port
EXPOSE 4000

# Start the server
CMD ["node", "dist/server.js"]
