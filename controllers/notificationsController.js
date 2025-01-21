const Notification = require("../models/Notification");

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
  const roles = [isAdmin, isDirector, isManager];
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
          "_id notificationType notificationTitle notificationExcerpt notificationDate notificationTo notificationIsRead"
        ) // Select specific fields
        .lean();
      //console.log(notifications,'notifications')
      if (!notifications || notifications.length === 0) {
        return res.status(404).json({ message: "No notifications found" });
      }

      // Filter notifications for non-admin/manager/director users, if a parent is connected, he will get the notification
      if (
        !(
          roles.includes(isAdmin) ||
          roles.includes(isManager) ||
          roles.includes(isDirector)
        )
      ) {
        //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

        notifications = notifications.filter(
          (notif) => notif.notificationTo.includes(String(userId))
        );
      }

    const lastnotifications = notifications.slice(0, 8)

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
    //console.log('here')
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
const lastnotifications= notifications.slice(0, 50)
    // Return the notification inside an array
    return res.json(lastnotifications);; /////we need it inside  an array to avoid response data error
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
    notificationTo, //the user id who will receive
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
    !notificationTo ||
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
    notificationTo,
    notificationTitle,
  });

  if (duplicate) {
    return res.status(409).json({
      message: `Duplicate notification   ${duplicate.notificationTitle}}`,
    });
  }

  const notificationObject = {
    notificationYear: notificationYear,
    notificationTo: notificationTo, //the user id who will receive
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
    notificationTo, //the user id who will receive
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
    !notificationTo ||
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

  notificationToUpdate.notificationYear = notificationYear;
  notificationToUpdate.notificationTo = notificationTo;
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
const deleteNotification = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const notification = await Notification.findById(id).exec();

  if (!notification) {
    return res
      .status(400)
      .json({ message: "Notification to delete not found" });
  }

  // Delete the notification
  const result = await notification.deleteOne();

  const reply = `Deleted ${result?.deletedCount} notification`;

  return res.json({ message: reply });
});

module.exports = {
  getAllNotifications,
  createNewNotification,
  updateNotification,
  deleteNotification,
};
