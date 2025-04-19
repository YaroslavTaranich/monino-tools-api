FROM node:20

WORKDIR /app

COPY package*.json ./

COPY tsconfig*.json ./

RUN npm ci

RUN npm run build

COPY . .

CMD ["npm", "run", "start:dev"]