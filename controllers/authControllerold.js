const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { username, password, criteria } = req.body; //we expect a username and password to come in the login request,
  const USER_REGEX = /^[A-z 0-9]{6,20}$/;
  //testing for code injection
  if (criteria && !USER_REGEX.test(criteria)) {
    //secury to avoid injectionof code
    return res
      .status(400)
      .json({ message: "Unauthorised, special characters detected" });
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
  console.log(username, "username");
  const foundUser = await User.findOne({ username }).exec();
console.log(foundUser)
  if (!foundUser || !foundUser.userIsActive) {
    return res
      .status(401)
      .json({ message: "Unauthorized, username not found" });
  }
  const match = await bcrypt.compare(password, foundUser.password);

  if (!match)
    return res
      .status(401)
      .json({ message: "Unauthorized, password does not match" });

  const accessToken = jwt.sign(
    {
      userInfo: {
        userId: foundUser._id,
        username: foundUser.username,
        userRoles: foundUser.userRoles,
        userAllowedActions: foundUser.userAllowedActions,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "20s" }
  );

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: process.env.NODE_ENV === "production", //https
    sameSite: "None", //cross-site cookie
    maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
  });

  // Send accessToken containing username and roles
  res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
  const {cookies} = req;
console.log(req)
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized, no cookie found" });

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const foundUser = await User.findOne({
        username: decoded.username,
      }).exec();

      if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = jwt.sign(
        {
          userInfo: {
            userId: decoded._id,
            username: foundUser.username,
            userRoles: foundUser.userRoles,
            userAllowedActions: foundUser.userAllowedActions,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "20s" }
      );

      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "None",
    secure: process.env.NODE_ENV === "production", //https
  });
  res.json({ message: "Cookie cleared" });
};

module.exports = {
  login,
  refresh,
  logout,
};
