FROM node:24-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

# Create symlink so that ../../node_modules resolves to /app/node_modules inside the container
RUN ln -s /app/node_modules /node_modules

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/ .
COPY shared/ /shared/

RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
