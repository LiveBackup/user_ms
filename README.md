# user_ms

This application is generated using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
[initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

## Running the application for Development

### Requirements

* Node.js V16 (Latest LTS: Gallium).
* [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

### Install dependencies

Install the project resolved dependencies in `package-lock.json` file using npm:

```sh
npm ci
```

In case the `package-lock.json` file is not present run instead:

```sh
npm i
```

### Define the .env file

A `.env.example` file is provided with the EVM variables required for this component to run. Copy this example file to a `.evn` file by running:


```sh
cp .example.env .env
```
**Warning**: The `.example.env` file contains dummy values for some secrets and passwords. Make sure to modify them and add strong ones when deploying to a production environment.

### Start dependencies container

This component depend on an Postgres database to store the account data and a Redis DB to publish async task to underlying components. To start both containers using docker compose run:

```sh
docker-compose -f ./dev-docker-compose.yml up
```
**Note:** You can add a `-d` flag at the end of the `docker-compose` command to detach the process of your active SHELL session.

### Migrate the DB schema

There are two options to migrate the schema. You cna run the following command to migrate the new changes to a DB schema:

```sh
npm run migrate
```

Or, in case you are introducing and breaking change you cna run:

```sh
npm run migrate -- --rebuild
```
**Warning**: Executing this command will delete the existing schemas in DB among the existing information. Be careful when running it.

### Run the application

Now, you can simply start the application by running:

```sh
npm start
```

Or start a watch session to restart the server every time you save a code change by running:

```sh
npm run start:dev
```

Open http://127.0.0.1:3000 in your browser to watch the Swagger docs.

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to
understand how you can continue to add features to this application.

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)
