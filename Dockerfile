FROM node:23-alpine3.20
WORKDIR /user/src/app
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . ./
CMD ["npm","run","prod"]