FROM node:24-alpine3.22

WORKDIR /api

COPY ./package*.json .

RUN npm install
# RUN npm ci # instead of npm install, better for production

COPY . .

# RUN npm run build # for production

ENTRYPOINT ["npm", "run"]
CMD ["start:dev"]
