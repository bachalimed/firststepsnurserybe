const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

require("dotenv").config();
// @desc Login
// @route POST /auth after the root url
// @access Public
const login = async (req, res) => {
  const { username, password, criteria } = req.body; //we expect a username and password to come in the login request,
  const USER_REGEX = /^[A-z 0-9]{6,20}$/;
  //testing for code injection
  if (criteria && !USER_REGEX.test(criteria)) {
    //secury to avoid injectionof code
    return res.status(400).json({ message: "Unauthorised" });
  }
  //forgot password request will set flag isforgotpassword in user collection so that the admin updated the password
  if (criteria === "forgotPassword") {
    console.log("forgot password detected");
    if (!username) {
      return res.status(400).json({ message: "Required data is missing" });
    }

    const userFound = await User.findOne({ username }).exec();
    if (!userFound) {
      return res
        .status(401)
        .json({ message: "No user found for the provided username" });
    }
    if (userFound.isForgotPassword) {
      return res
        .status(401)
        .json({ message: "Password reset request already submitted" });
    }

    userFound.isForgotPassword = true;

    const updatedUser = await userFound.save(); //save method received when we did not include lean

    return res.json({
      message: `Request submitted successfully`,
    });
  }
  // normal login path starts here

  const cookies = req.cookies;
  if (!username || !password) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  const foundUser = await User.findOne({ username }).exec();

  if (!foundUser || !foundUser.userIsActive) {
    return res
      .status(401)
      .json({ message: "Unauthorized: user not found or user is not Active" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res
      .status(401)
      .json({ message: "Unauthorized password not matching" });

  //create access token (can be read by js so no security data here)
  const accessToken = jwt.sign(
    {
      UserInfo: {
        userId: foundUser._id,
        username: foundUser.username,
        userRoles: foundUser.userRoles,
        userAllowedActions: foundUser.userAllowedActions,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" } //access token expires in 15 minutes
  );
  //ceate refresh token
  const newRefreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  //console.log(refreshToken, "refreshToken");

  const newRefreshTokenArray = !cookies?.jwt
    ? foundUser.refreshToken
    : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

  //remove old cookie
  if (cookies?.jwt) {
    //case of usre loged and did not use access token,we need toclear the all refereshtoken (maybe stolen rt)
    const refreshToken = cookies.jwt;
    const foundToken = await User.findOne({ refreshToken }).exec();

    //detected reuser of rt
    if (!foundToken) {
      console.log("attempt reuse of rt at login");
      //clear all previous rt
      newRefreshTokenArray = [];
    }
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  }
  // save the refresh token with the logged user
  foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  const result = await foundUser.save();
  //console.log(result,'saved token in db')

  // Create secure cookie with refresh token
  res.cookie("jwt", newRefreshToken, {
    httpOnly: true, //accessible only by web server
    secure: true, //https
    sameSite: "None", //cross-site cookie if we host front and backend in separate sites
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry 7days here: to match rT of 7days
  });

  // Send accessToken containing username and roles
  res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt)
    return res.status(401).json({ message: "Unauthorized, no cookie found" });

  const refreshToken = cookies.jwt;
  //delete the cookie after getting the jwt tooken from it
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  //check the token saved with the user
  const foundUser = await User.findOne({ refreshToken }).exec();

  //detected refesh token reuse (using a valid old refersh token), delete all referesh tokens of that account
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.sendStatus(403); //Forbidden
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec();
        hackedUser.refreshToken = [];
        const result = await hackedUser.save();
        console.log(result);
      }
    );

    return res.sendStatus(403); //Forbidden
  }

  // valid torken adn we will issue a new one
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  //evaluate jwt
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        //expired token
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
      }

      if (err || foundUser.username !== decoded.username)
        return res.status(403).json({ message: "Forbidden" });
      //refresh token was still valid
      // const foundUser = await User.findOne({
      //   username: decoded.username,
      // }).exec();

      // if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          UserInfo: {
            userId: foundUser._id,
            username: foundUser.username,
            userRoles: foundUser.userRoles,
            userAllowedActions: foundUser.userAllowedActions,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      );

      //ceate refresh token
      const newRefreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // save the refresh token with the logged user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
      const result = await foundUser.save();

      // Create secure cookie with refresh token
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true, //accessible only by web server
        secure: true, //https
        sameSite: "None", //cross-site cookie if we host front and backend in separate sites
        maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry 7days here: to match rT of 7days
      });
      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = async (req, res) => {
  const cookies = req.cookies;
  //if no cookie is there
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;
  // Is refreshToken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  foundUser.refreshToken = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );
  const result = await foundUser.save();
  console.log(result);

  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.sendStatus(204);
};

module.exports = {
  login,
  refresh,
  logout,
};
