import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }
  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "That username is too short",
      },
    ];
  }
  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Username cannot include the symbol '@'",
      },
    ];
  }
  if (options.password.length <= 2) {
    return [
      {
        field: "password",
        message: "length must be greater than 2",
      },
    ];
  }
  return null;
};
