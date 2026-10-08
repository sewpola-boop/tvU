FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/model.bundle.mjs /app/auth.bundle.mjs /app/table.bundle.mjs /app/member.bundle.mjs /app/chat.bundle.mjs /app/operations.bundle.mjs ./
COPY server.mjs package.json ./
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node","server.mjs"]
