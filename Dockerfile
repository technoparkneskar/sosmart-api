FROM hazmi35/node:18-dev-alpine as build-stage

LABEL name "sosmart-api (build-stage)"
LABEL maintainer "Technopark Neskar <technoparkn@gmail.com>"

WORKDIR /tmp/build

# Install build tools for node-gyp
RUN apk add --no-cache build-base git python3 openssl-dev

# Copy package.json and package-lock.json
COPY package.json .
COPY package-lock.json .

# Install node dependencies
RUN npm install

# Now copy project files
COPY . .

# Build typescript project
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Get ready for production
FROM hazmi35/node:18-alpine

LABEL name "sosmart-api"
LABEL maintainer "Technopark Neskar <technoparkn@gmail.com>"

WORKDIR /app

# Install dependencies
RUN apk add --no-cache tzdata

# Copy needed project files
COPY --from=build-stage /tmp/build/package.json .
COPY --from=build-stage /tmp/build/package-lock.json .
COPY --from=build-stage /tmp/build/node_modules ./node_modules
COPY --from=build-stage /tmp/build/dist ./dist
COPY --from=build-stage /tmp/build/secret-key .
COPY --from=build-stage /tmp/build/sosmart-technopark-firebase.json .

ENV TZ=Asia/Jakarta

CMD ["node", "--experimental-specifier-resolution=node", "dist"]