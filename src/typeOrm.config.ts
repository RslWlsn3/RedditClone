import { DataSourceOptions } from "typeorm/data-source/DataSourceOptions";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
  type: "postgres",
  // host: "localhost",
  // port: 3306,
  username: "postgres",
  password: "postgres",
  database: "cmreddit2",
  logging: true,
  synchronize: true,
  entities: [Post, User],
} as DataSourceOptions;
