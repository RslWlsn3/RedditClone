import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { Post } from "./entities/Post";
import { userResolver } from "./resolvers/user";
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient } from "redis";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import cors from "cors";
import { User } from "./entities/User";
import Redis from "ioredis";
import { DataSource } from "typeorm";
import typeOrmConfig from "./typeOrm.config";

const main = async () => {
  const AppDataSource = new DataSource(typeOrmConfig);

  const app = express();

  const RedisStore = connectRedis(session);

  // redis@v4
  // const redisClient = createClient({ legacyMode: true });
  // redisClient.connect().catch(console.error);

  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    }),
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        sameSite: "lax", //csrf
        secure: __prod__, //Only use https, localhost insn't though so only do this in prod
      },
      saveUninitialized: false,
      secret: "asdfagea",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, userResolver],
      validate: false,
    }),
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        settings: { "request.credentials": "include" },
      }),
    ],
    context: ({ req, res }) => ({ req, res, redis }), //context object is accessible to all resolvers
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({
    app,
    cors: false,
    // cors: { origin: "http://localhost:3000", credentials: true },
  }); //creates a graphql endpoint

  app.get("/", (_, res) => {
    res.send(_posts);
  });
  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.log(err);
});
