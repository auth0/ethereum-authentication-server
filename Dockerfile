FROM npm-dependencies:latest
RUN npm install -g ./ethereum-registration-service
RUN npm install -g ./ethereum-user-db-service
RUN npm install -g ./ethereum-crypto
COPY package.json package.json
RUN npm install
ENV 1 2
ADD src src
ADD config config 
ADD test test
ADD index.js index.js
ADD start.sh start.sh
RUN tr -d '\r' < start.sh > start2.sh
RUN rm start.sh
RUN mv start2.sh start.sh
RUN npm test
EXPOSE 3000 3000
