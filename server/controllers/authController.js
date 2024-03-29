import Joi from "joi";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import UserDto from "../dto/user.js";
import * as JWTService from "../services/JWTService.js";
import RefreshToken from "../models/token.js";

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;

const authController = {
  async register(req, res, next) {
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword: Joi.ref("password"),
    });

    const { error } = userRegisterSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { username, name, email, password } = req.body;

    try {
      const emailInUse = await User.exists({ email });
      const usernameInUse = await User.exists({ username });
      if (emailInUse || usernameInUse) {
        const errorMsg = emailInUse
          ? "Email already in use"
          : "Username already in use";
        return next({ status: 409, message: errorMsg });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userToRegister = new User({
        username,
        name,
        email,
        password: hashedPassword,
      });
      const user = await userToRegister.save();

      const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
      const refreshToken = JWTService.signRefreshToken(
        { _id: user._id },
        "60m"
      );

      await JWTService.storeRefreshToken(refreshToken, user._id);

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      // response logic follows
      const userDto = new UserDto(user);
      return res.status(201).json({ user: userDto, auth: true });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattern).required(),
    });

    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) {
        return next({
          status: 401,
          message: "Invalid username or password",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return next({
          status: 401,
          message: "Invalid username or password",
        });
      }

      // Generate JWT tokens
      const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
      const refreshToken = JWTService.signRefreshToken(
        { _id: user._id },
        "60m"
      );

      try {
        await RefreshToken.updateOne(
          { _id: user._id },
          {
            token: refreshToken,
          },
          { upsert: true }
        );
      } catch (error) {
        return next(error);
      }

      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });

      // response logic follows
      const userDto = new UserDto(user);
      return res.status(200).json({ user: userDto, auth: true });
    } catch (error) {
      return next(error);
    }
  },

  async logout(req, res, next) {
    const { refreshToken } = req.cookies;

    try {
      await RefreshToken.deleteOne({ token: refreshToken });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    } catch (error) {
      return next(error);
    }
    res.status(200).json({ user: null, auth: false });
  },

  async refresh() {},
};

export default authController;
