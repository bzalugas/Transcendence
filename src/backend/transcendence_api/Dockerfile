FROM node:22-alpine

WORKDIR /api

COPY . .

RUN npm install

RUN npm run build

CMD ["npm", "run", "start:dev"]

