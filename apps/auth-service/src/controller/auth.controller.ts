import { NextFunction, Request, Response } from "express";
import { validateRegistrationData } from "../utils/auth.helper";
import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/prisma";

// Register a new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validateRegistrationData(req.body, "user");
  const { name, email } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email, name } });

  if (existingUser) {
    return next(new ValidationError("User already exists!"));
  }

  // await checkOtpRestrictions(email, next);
};
