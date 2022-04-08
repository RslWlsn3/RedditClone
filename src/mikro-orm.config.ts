import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { mikroOrmPswrd } from "./config";

export default {
  allowGlobalContext: true,
  migrations: {
    path: path.join(__dirname, "./migrations"),
    glob: "!(*.d).{js,ts}",
  },
  entities: [Post, User],
  dbName: "cmreddit",
  user: "postgres",
  password: mikroOrmPswrd,
  type: "postgresql",
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
