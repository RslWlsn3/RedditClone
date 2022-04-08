import { MikroORM, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Post } from "../entities/Post";
import { Resolver, Query, Ctx, Int, Arg, Mutation } from "type-graphql";
import { emit } from "process";
import { type } from "os";

@Resolver()
export class PostResolver {
  @Query(() => [Post]) //setting graphql type
  posts(@Ctx() { orm }: any): Promise<Post[]> {
    return orm.em.find(Post, {});
  }

  @Query(() => Post, { nullable: true }) //setting graphql type
  post(@Arg("id") id: number, @Ctx() { orm }: any): Promise<Post[] | null> {
    return orm.em.findOne(Post, { id });
  }

  @Mutation(() => Post) //setting graphql type
  async createPost(
    @Arg("title") title: string,
    @Ctx() { orm }: any
  ): Promise<Post> {
    const post = orm.em.create(Post, { title });
    await orm.em.persistAndFlush(post);
    return post;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Ctx() { orm }: any
  ): Promise<Post | null> {
    const post = await orm.em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await orm.em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { orm }: any
  ): Promise<boolean> {
    orm.em.nativeDelete(Post, { id });
    return true;
  }
}
