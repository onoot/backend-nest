FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json nest-cli.json ./
RUN npm install

COPY src/ src/
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main"]
