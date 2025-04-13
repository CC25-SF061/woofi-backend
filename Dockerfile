FROM node:23-alpine3.20
EXPOSE 8070
WORKDIR /user/src
COPY package.json .
COPY package-lock.json .
RUN npm ci
CMD ["npm","run","prod"]