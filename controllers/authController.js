const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const asyncHandler = require("express-async-handler");

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
   // console.log("forgot password detected");
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

  const { cookies } = req;
  //console.log(`cookie available at login: ${JSON.stringify(cookies)}`);

  if (!username || !password) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  const foundUser = await User.findOne({ username }).exec();
//console.log(foundUser,'founduser in loginnnnnnnn')
  if (!foundUser || !foundUser.userIsActive) {
    return res
      .status(401)
      .json({ message: "Unauthorized: user not found or user is not Active" });
  }

  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    //create access token (can be read by js so no security data here)
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
      { expiresIn: "30m" } //access token expires in 15 minutes
    );
    //ceate refresh token
    const newRefreshToken = jwt.sign(
      {
        username: foundUser.username,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    //console.log(refreshToken, "refreshToken");

    let newRefreshTokenArray = !cookies?.jwt
      ? foundUser.refreshToken
      : foundUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    // if (cookies?.jwt) {
    //   //case of usre loged and did not use access token,we need to clear  all refereshtoken (maybe stolen rt)
    //   const refreshToken = cookies.jwt;

    //   const foundToken = await User.findOne({ refreshToken }).exec();
    //   //detected reuse of rt
    //   if (!foundToken) {
    //     console.log("attempt reuse of rt at login");
    //     //clear all previous rt
    //     newRefreshTokenArray = [];
    //   }
    //   res.clearCookie("jwt", {
    //     httpOnly: true,
    //     sameSite: "None",
    //     secure: process.env.NODE_ENV === "production",
    //   });
    // }
    // save the refresh token with the logged user
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await foundUser.save();
    //console.log(result, "saved token in db");

    // Create secure cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true, //accessible only by web server
      secure: true,
      // secure: process.env.NODE_ENV === "production",
      sameSite: "None", //cross-site cookie if we host front and backend in separate sites
      maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry 7days here: to match rT of 7days
    });

    // Send accessToken containing username and roles
    res.json({ accessToken });
  } else {
    return res
      .status(401)
      .json({ message: "Unauthorized password not matching" });
  }
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
// const refresh = async (req, res) => {
//   const {cookies }= req;
//   console.log(cookies, "cookies at refresh");
//   if (!cookies?.jwt) {
//     console.log("no cookies.jwt found  at refresh");

//     return res.status(401).json({ message: "Unauthorized, no cookie found" });
//   }

//   const refreshToken = cookies.jwt;

//   //check the token saved with the user
//   //  const foundUser = await User.findOne({ refreshToken }).exec();//////////////////////////////////////
//  const foundUser = await User.findOne({ refreshToken }).exec();

//   if (!foundUser || !foundUser.userIsActive) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: user not found or user is not Active" });
//   }

//    //delete the cookie after getting the jwt tooken from it and validating it
//    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
//   //detected refesh token reuse (using a valid old refersh token), delete all referesh tokens of that account
//   if (!foundUser) {
//     jwt.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET,
//       async (err, decoded) => {
//         if (err) return res.sendStatus(403); //Forbidden
//         const hackedUser = await User.findOne({
//           username: decoded.username,
//         }).exec();
//         hackedUser.refreshToken = [];
//         const result = await hackedUser.save();
//         console.log("hacked user situation");
//       }
//     );

//     return res.sendStatus(403); //Forbidden
//   }

//   // valid token adn we will issue a new one
//   const newRefreshTokenArray = foundUser.refreshToken.filter(
//     (rt) => rt !== refreshToken
//   );

//   //evaluate jwt
//   jwt.verify(
//     refreshToken,
//     process.env.REFRESH_TOKEN_SECRET,
//     async (err, decoded) => {
//       if (err) {
//         //expired token
//         foundUser.refreshToken = [...newRefreshTokenArray];
//         const result = await foundUser.save();
//       }

//       if (err || foundUser.username !== decoded.username)
//         return res.status(403).json({ message: "Forbidden" });
//       //refresh token was still valid
//       // const foundUser = await User.findOne({
//       //   username: decoded.username,
//       // }).exec();

//       // if (!foundUser) return res.status(401).json({ message: "Unauthorized" });

//       //refresh token still valid
//       const accessToken = jwt.sign(
//         {
//           userInfo: {
//             userId: foundUser._id,
//             username: foundUser.username,
//             userRoles: foundUser.userRoles,
//             userAllowedActions: foundUser.userAllowedActions,
//           },
//         },
//         process.env.ACCESS_TOKEN_SECRET,
//         { expiresIn: "10s" }
//       );

//       //ceate refresh token
//       const newRefreshToken = jwt.sign(
//         {
//           userInfo: {
//             userId: foundUser._id,
//             username: foundUser.username,
//             userRoles: foundUser.userRoles,
//             userAllowedActions: foundUser.userAllowedActions,
//           },
//         },
//         process.env.REFRESH_TOKEN_SECRET,
//         { expiresIn: "7d" }
//       );

//       // save the refresh token with the logged user
//       foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
//       const result = await foundUser.save();

//       // Create secure cookie with refresh token
//       res.cookie("jwt", newRefreshToken, {
//         httpOnly: true, //accessible only by web server
//         secure: true, //https
//         sameSite: "None", //cross-site cookie if we host front and backend in separate sites
//         maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry 7days here: to match rT of 7days
//       });
//       res.json({ accessToken });
//     }
//   );
// };

const refresh = async (req, res) => {
  const { cookies } = req;
  //console.log(cookies, "cookies avaialble at refresh");
  if (!cookies?.jwt) {
    //console.log("No cookies at refresh");
    return res.status(401).json({ message: "Unauthorized, no cookie found" });
  }
  const refreshToken = cookies.jwt;
  //moved clear cookie for later

  ////////// racing can be caused by multiple requests in short time, will simulate a hacked user
  const foundUser = await User.findOne({ refreshToken }).exec(); 

  //detected refresh token reuse
  // console.log(
  //   foundUser?.username,
  //   foundUser?.userIsActive,
  //   "foundUser , foundUser.userIsActive"
  // );
  if (!foundUser || !foundUser.userIsActive) {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, decoded) => {
        if (err) return res.sendStatus(403); //Forbidden
        //console.log("attempted refresh token reuse!");
        const hackedUser = await User.findOne({
          username: decoded.username,
        }).exec();
        hackedUser.refreshToken = [];
        const result = await hackedUser.save();
        //console.log(result.username, "saved hacked user empty array");
      }
    );
    return res.sendStatus(403); //Forbidden
  }
 
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        //console.log("expired refresh token");
        foundUser.refreshToken = [...newRefreshTokenArray];
        const result = await foundUser.save();
        console.log(result);
      }
      if (err || foundUser.username !== decoded.username)
        return res.sendStatus(403);
      // Refresh token  still valid
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
        { expiresIn: "30m" }
      );

      const newRefreshToken = jwt.sign(
        {
          username: foundUser.username,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      // Saving refreshToken with current user
      foundUser.refreshToken = [
        ...new Set([...newRefreshTokenArray, newRefreshToken]),
      ];
      const result = await foundUser.save();
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        // secure: process.env.NODE_ENV === "production",
      });
      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        secure: true,
        // secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken });
    }
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = async (req, res) => {
  try {
    console.log('logout started')
    const { cookies } = req;
    //if no cookie is there
    if (!cookies?.jwt) return res.sendStatus(204); //No content
    const refreshToken = cookies.jwt;
    // Is refreshToken in db?
    
    const foundUser = await User.findOne({ refreshToken }).exec();

    if (!foundUser) {
      res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        // secure: process.env.NODE_ENV === "production",
      });
      return res.sendStatus(204);
    }
   // console.log(foundUser,'foundUser')
    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(
      (rt) => rt !== refreshToken
    );
    const result = await foundUser.save();
    //console.log(result);

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      // secure: process.env.NODE_ENV === "production",
    });
    console.log("logged out now");
    res.sendStatus(204);
  } catch (err) {
    console.error("Error during logout:", err);
    res.sendStatus(500); // Internal Server Error
  }
};

module.exports = {
  login,
  refresh,
  logout,
};
