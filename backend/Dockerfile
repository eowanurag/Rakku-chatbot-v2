FROM node:24-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

COPY backend/prisma ./prisma/
RUN npx prisma generate

COPY backend/ .
COPY shared/ /shared/

RUN npm run build

EXPOSE 3001
CMD ["npm", "run", "start:prod"]
