FROM node:24-alpine3.22

WORKDIR /app

COPY ./package*.json .

RUN npm install better-auth

COPY . .

# RUN npm run build

ENTRYPOINT ["npm", "run"]
CMD ["dev"]
