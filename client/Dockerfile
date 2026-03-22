FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Expose Vite dev server on all networks
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
