const Notification = require("../models/Notification");
const User = require("../models/User");

const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all notification
// @route GET 'desk/notification
// @access Private // later we will establish authorisations
const getAllNotifications = asyncHandler(async (req, res) => {
  // console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const {
    id,
    criteria,
    selectedYear,
    selectedDate,
    userId,
    isAdmin,
    isDirector,
    isManager,
  } = req.query;

  if (id) {
    // Find a single notification by its ID
    const notification = await Notification.findOne({ _id: id }).lean();

    if (!notification) {
      return res.status(400).json({ message: "Notification not found" });
    }

    // Return the notification inside an array
    return res.json([notification]); //we need it inside  an array to avoid response data error
  }

  if (criteria === "excerpt") {
    //we only need the last 8 notifications
    try {
      const currentDate = new Date();

      //console.log("Fetching notifications before:", currentDate.toISOString());

      // Find notifications with a date and time less than the current date
      const notifications = await Notification.find({
        notificationDate: { $lt: currentDate }, // Compare against the current date and time
      })
        .sort({ notificationDate: -1 }) // Most recent notifications first
        .select(
          "_id notificationType notificationTitle notificationExcerpt notificationDate notificationToUsers notificationIsRead"
        ) // Select specific fields
        .lean();
      //console.log(notifications,'notifications')
      if (!notifications || notifications.length === 0) {
        return res.status(404).json({ message: "No notifications found" });
      }

      // Filter notifications for non-admin/manager/director users, if a parent is connected, he will get the notification
      if (isAdmin === "true") {
        const lastnotifications = notifications?.slice(0, 8);
        return res.json(lastnotifications);
      }
      console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

  

      const dedicatedNotifications = notifications.filter((notif) =>
        notif.notificationToUsers.some((id) =>
          id.equals(new mongoose.Types.ObjectId(userId))
        )
      );
      const lastnotifications = dedicatedNotifications?.slice(0, 8);
      // Return the filtered and limited notifications
      return res.json(lastnotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while fetching notifications" });
    }
  }
  if (selectedDate) {
    // Find a single notification by its ID
    //console.log("here");
    const currentDate = new Date();

    //console.log("Fetching notifications before:", currentDate.toISOString());

    // Find notifications with a date and time less than the current date
    const notifications = await Notification.find({
      notificationDate: { $lt: currentDate }, // Compare against the current date and time
    })
      .sort({ notificationDate: -1 }) // Most recent notifications first
      // .select(
      //   "_id notificationType notificationTitle notificationExcerpt notificationDate notificationTo notificationIsRead"
      // ) // Select specific fields
      .lean();

    if (!notifications) {
      return res.status(400).json({ message: "Notifications not found" });
    }
    //console.log(isAdmin);
    //filter notifications for concerned user
    //console.log(typeof isAdmin, isAdmin);
    if (isAdmin === "true") {
      //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");
      return res.json(notifications);
    }
    //console.log("now heer afetr check");
    const dedicatedNotifications = notifications.filter((notif) =>
      notif.notificationToUsers.some((id) =>
        id.equals(new mongoose.Types.ObjectId(userId))
      )
    );

    // Return the notification inside an array
    return res.json(dedicatedNotifications?.slice(0, 200)); /////we need it inside  an array to avoid response data error
  }

  // If no ID is provided, fetch all notifications
});

//----------------------------------------------------------------------------------
// @desc Create new notification
// @route POST 'desk/notification
// @access Private
const createNewNotification = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    notificationYear,
    notificationToParents,
    notificationToUsers, //the user id who will receive
    notificationType,
    notificationPayment,
    notificationLeave,
    notificationAdmission,
    notificationTitle,
    notificationContent,
    notificationExcerpt,
    notificationDate,
    notificationIsToBeSent,
    notificationIsRead,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields

  if (
    !notificationYear ||
    !notificationType ||
    !notificationTitle ||
    !notificationContent ||
    !notificationDate ||
    !notificationIsToBeSent
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate notification or invoices paid previously
  const duplicate = await Notification.findOne({
    notificationYear,
    notificationDate,

    notificationTitle,
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate notification   ${duplicate.notificationTitle}}`,
    });
  }
  const targetRoles = ["Director", "Manager", "Admin"]; // Roles to filter by

  // Find users with matching roles and populate employeeId
  const usersWithRoles = await User.find({
    userRoles: { $in: targetRoles },
  })
    .populate({
      path: "employeeId",
      select: "employeeIsActive", // Only include employeeIsActive in the populated field
    })
    .lean();

  // Filter users where employeeIsActive is true
  const targetUsers = usersWithRoles
    .filter((user) => user?.employeeId?.employeeIsActive)
    .map((user) => user._id); // Extract user._id for active employees

  const notificationObject = {
    notificationYear: notificationYear,
    notificationToUsers: targetUsers, //the users id who will receive
    notificationType: notificationType,
    notificationPayment: notificationPayment,
    notificationLeave: notificationLeave,
    notificationAdmission: notificationAdmission,
    notificationTitle: notificationTitle,
    notificationContent: notificationContent,
    notificationExcerpt: notificationExcerpt,
    notificationDate: notificationDate,
    notificationIsToBeSent: notificationIsToBeSent,
    notificationIsRead: notificationIsRead,
  }; //construct new notification to be stored

  // Create and store new notification
  const notification = await Notification.create(notificationObject);
  if (!notification) {
    return res.status(400).json({ message: "Invalid data received" });
  }
  // If created and students updated
  return res.status(201).json({
    message: `Notification  created successfully `,
  });
});

// @desc Update a notification
// @route PATCH 'desk/notification
// @access Private
const updateNotification = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that notification in any other, the latter will have an ending date
  const {
    id,
    notificationYear,

    notificationType,
    notificationPayment,
    notificationLeave,
    notificationAdmission,
    notificationTitle,
    notificationContent,
    notificationExcerpt,
    notificationDate,
    notificationIsToBeSent,
    notificationIsRead,
  } = req?.body;

  // Confirm data
  if (
    !id ||
    !notificationYear ||
    !notificationType ||
    !notificationTitle ||
    !notificationContent ||
    !notificationDate ||
    !notificationIsToBeSent
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the notification exist to update?
  const notificationToUpdate = await Notification.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!notificationToUpdate) {
    return res
      .status(400)
      .json({ message: "Notification to update not found" });
  }
  const targetRoles = ["Director", "Manager", "Admin"]; // Roles to filter by

  // Find users with matching roles and populate employeeId
  const usersWithRoles = await User.find({
    userRoles: { $in: targetRoles },
  })
    .populate({
      path: "employeeId",
      select: "employeeIsActive", // Only include employeeIsActive in the populated field
    })
    .lean();

  // Filter users where employeeIsActive is true
  const targetUsers = usersWithRoles
    .filter((user) => user?.employeeId?.employeeIsActive)
    .map((user) => user._id); // Extract user._id for active employees

  notificationToUpdate.notificationYear = notificationYear;
  notificationToUpdate.notificationToUsers = targetUsers;
  notificationToUpdate.notificationType = notificationType;
  notificationToUpdate.notificationPayment = notificationPayment;
  notificationToUpdate.notificationLeave = notificationLeave;
  notificationToUpdate.notificationAdmission = notificationAdmission;
  notificationToUpdate.notificationTitle = notificationTitle;
  notificationToUpdate.notificationContent = notificationContent;
  notificationToUpdate.notificationExcerpt = notificationExcerpt;
  notificationToUpdate.notificationDate = notificationDate;
  notificationToUpdate.notificationIsToBeSent = notificationIsToBeSent;
  notificationToUpdate.notificationIsRead = notificationIsRead;

  //console.log(notificationToUpdate,'notificationToUpdate')
  const updatedNotification = await notificationToUpdate.save(); //save old notification
  if (!updatedNotification) {
    return res.status(400).json({ message: "invalid data received" });
  }
  return res.status(201).json({
    message: `Notification updated successfully`,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deleteNotification = async (req, res) => {
  const { ids, userId, isAdmin } = req.body; // Array of notification IDs and the user ID

  // Confirm data
  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No notification IDs provided" });
  }

  try {
    // Fetch all notifications matching the provided IDs
    const notifications = await Notification.find({ _id: { $in: ids } }).lean();

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "Notifications not found" });
    }

    // Array to track deletion statuses
    const deletionResults = [];
    if (isAdmin === "true") {
      // If the user is an admin, completely delete the notifications
      const deleteResult = await Notification.deleteMany({ _id: { $in: ids } });
      return res.status(200).json({
        message: `Deleted ${deleteResult?.deletedCount} Notification(s) sucessfully`,
        // results: deleteResult,
      });
    }
    // Convert `userId` to ObjectId for proper comparison
    const userObjectId = userId;
    for (const notification of notifications) {
      const { _id, notificationToUsers } = notification;

      // Check if userId exists in the `notificationToUsers` array
      const isUserAssociated = notificationToUsers.some((user) =>
        user.equals(userObjectId)
      );

      if (!isUserAssociated) {
        deletionResults.push({
          id: _id,
          status: "failed",
          message: "User ID not associated with this notification",
        });
        continue;
      }

      // If the user is the only one in the array, delete the notification
      if (notificationToUsers.length === 1) {
        await Notification.findByIdAndDelete(_id);
        deletionResults.push({
          id: _id,
          status: "deleted",
          message: "Notification deleted successfully",
        });
        continue;
      }

      // Otherwise, remove the userId from the array
      await Notification.findByIdAndUpdate(
        _id,
        { $pull: { notificationToUsers: userObjectId } }, // Remove the userId from the array
        { new: true } // Return the updated document
      );
      deletionResults.push({
        id: _id,
        status: "updated",
        message: "User removed from notification",
      });
    }

    return res.status(200).json({
      message: `Deleted Notification(s)`,
      
    });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return res.status(500).json({
      message: "An error occurred while deleting notifications",
      error: error.message,
    });
  }
};

module.exports = {
  getAllNotifications,
  createNewNotification,
  updateNotification,
  deleteNotification,
};
