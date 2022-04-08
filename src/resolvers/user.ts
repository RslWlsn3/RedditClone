import {
  Resolver,
  Query,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";
import { MyContext } from "src/types";

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FeildError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  //have resolver return a reponse obj similar to this when returning an error is possible
  @Field(() => [FeildError], { nullable: true }) //need to explicitly set the type since it is nullable
  errors?: FeildError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class userResolver {
  @Query(() => User)
  async me(@Ctx() { orm, req }: any) {
    if (!req.session.userId) {
      return null;
    }

    const user = await orm.em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { orm }: any
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "That username is too short",
          },
        ],
      };
    }
    if (options.password.length <= 2) {
      return {
        errors: [
          {
            field: "password",
            message: "That password is too short",
          },
        ],
      };
    }

    const hashedPasword = await argon2.hash(options.password);
    var user = orm.em.create(User, {
      username: options.username,
      password: hashedPasword,
    });
    try {
      await orm.em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "That username has already been taken",
            },
          ],
        };
      }
      console.log("message: ", err.message);
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { orm, req }: any
  ): Promise<UserResponse> {
    const user: User = await orm.em.findOne(User, {
      username: options.username,
    });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "That username doesn't exist",
          },
        ],
      };
    }
    const validPassword = await argon2.verify(user.password, options.password);
    if (!validPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;

    return { user };
  }
}
