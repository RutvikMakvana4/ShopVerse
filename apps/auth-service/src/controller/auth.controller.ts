import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from "../utils/auth.helper";
import { AuthError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";

// Register a new user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user");
    const { name, email } = req.body;

    const existingUser = await prisma.users.findUnique({
      where: { email, name },
    });

    if (existingUser) {
      return next(new ValidationError("User already exists!"));
    }

    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-mail");
    res.status(200).json({
      message: "OTP sent to email. Please verify your account.",
    });
  } catch (error) {
    next(error);
  }
};

// Verify the user otp
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError("All fields are required."));
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required."));
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AuthError("User does not exist."));
    }

    const isMatch = await bcrypt.compare(password, user.password!);

    if (!isMatch) {
      return next(new ValidationError("Invalid email or password."));
    }

    // generate access and refresh tokens
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    // store the access and refresh tokens in an http-only cookie
    setCookie(res, "access_token", accessToken);
    setCookie(res, "refresh_token", refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
