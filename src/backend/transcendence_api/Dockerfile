FROM node:24-alpine3.22

WORKDIR /api

COPY ./package*.json .

RUN npm install

COPY . .

RUN npm run build

ENTRYPOINT ["npm", "run"]
CMD ["start:dev"]
