FROM node:22-alpine
WORKDIR /app
COPY dist ./dist
COPY server.mjs model.bundle.mjs package.json ./
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
EXPOSE 3000
CMD ["node","server.mjs"]
