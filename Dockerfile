FROM node:18.12.1

WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
COPY index.ts /app/
RUN npm ci

EXPOSE 2773

CMD ["ts-node", "index.ts"]
