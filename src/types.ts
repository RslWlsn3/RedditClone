import { Request, Response, Express } from "express";
import session from "express-session";
import Redis from "ioredis";

export type MyContext = {
  orm: any;
  req: Request & session.Session & Partial<session.SessionData>;
  redis: Redis;
  res: Response;
  //   userLoader: ReturnType<typeof createUserLoader>;
  //   updootLoader: ReturnType<typeof createUpdootLoader>;
};
