import { Request, Response } from "express";
import { Redis } from "ioredis";
import { DataSource } from "typeorm";

export type MyContext = {
  req: Request & { session: Express.Session };
  redis: Redis;
  res: Response;
  AppDataSource: DataSource;
};
