import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
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
var cors = require("cors");

const main = async () => {
  const orm = await MikroORM.init(microConfig); //connect to db
  await orm.getMigrator().up(); //run migrations

  let _posts = await orm.em.find(Post, {});

  const app = express();

  const RedisStore = connectRedis(session);

  // redis@v4
  const redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  const cors = require("cors");
  const corsOptions = {
    origin: "*",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };

  // app.set("trust proxy", process.env.NODE_ENV !== "production"); //Cm - trying to make cookies work

  app.use(
    cors(corsOptions),
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
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
    context: ({ req, res }) => ({ orm: orm, req, res }), //context object is accessible to all resolvers
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app }); //creates a graphql endpoint

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
