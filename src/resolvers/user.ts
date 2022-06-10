import {
  Resolver,
  Query,
  Mutation,
  Field,
  Arg,
  Ctx,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";
import { MyContext } from "src/types";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { validateRegister } from "../utils/validateRegister";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

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
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { orm, redis }: any
  ) {
    const user = await orm.em.findOne(User, { email });
    if (!user) {
      // the email is not in db
      console.log("no userrrrrr");
      return true;
    }
    console.log("yes userrrrrr");

    const token = v4();
    console.log("before redis.set");
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); //forget password is good for 3 days
    console.log("after redis.set");

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    console.log("after sendEmail");

    return true;
  }

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
    @Ctx() { orm, req }: any
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPasword = await argon2.hash(options.password);
    var user = orm.em.create(User, {
      username: options.username,
      email: options.email,
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
    }

    //store user id session (sets a cookie on user, keeps them logged in)
    req.session.userId = user.id;
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { orm, req }: any
  ): Promise<UserResponse> {
    const user: User = await orm.em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "That username doesn't exist",
          },
        ],
      };
    }
    const validPassword = await argon2.verify(user.password, password);
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

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      //remove session in redis
      req.session.destroy((err) => {
        //clear cookie in response obj
        res.clearCookie(COOKIE_NAME); //working!
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        resolve(true);
      })
    );
  }
}
