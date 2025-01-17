const Payslip = require("../models/Payslip");
const User = require("../models/User");
const ExpenseCategory = require("../models/ExpenseCategory");
const Service = require("../models/Service");
const Payee = require("../models/Payee");
const Expense = require("../models/Expense");
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

//for payslips list component
const getPayslipsByYear = async (selectedYear) => {
  try {
    // Fetch payslips with the required employee and user data
    const payslips = await Payslip.find({ payslipYear: selectedYear })
      .populate({
        path: "payslipEmployee", // Populate the employee field
        select: "employeeCurrentEmployment", // Only select the necessary field
      })
      .populate({
        path: "payslipLeaveDays", // Populate the employee field
        select:
          "-leaveOperator -leaveCreator -leaveEmployee -leaveYear -leaveMonth", // Only select the necessary fields
      })
      .lean(); // Convert documents to plain JavaScript objects for easier manipulation
    // Add user information for each employee
    for (const payslip of payslips) {
      if (payslip?.payslipEmployee) {
        const user = await User.findOne(
          { employeeId: payslip?.payslipEmployee }, // Match the employee ID
          "userFullName" // Select only the userFullName field
        ).lean();
        // console.log(user,'user')

        // Attach user information to the payslip
        payslip.payslipEmployee.userFullName = user ? user.userFullName : null;
      }
    }

    return payslips;
  } catch (error) {
    console.error("Error fetching payslips:", error);
    throw error;
  }
};

//helper for finances stats
const getPayslipsStats = async (selectedYear) => {
  try {
    const result = await Payslip.aggregate([
      {
        $match: { payslipYear: selectedYear }, // Filter invoices by the selected year
      },
      {
        $addFields: {
          payslipAmountAsNumber: { $toDouble: "$payslipAmount" }, // Convert string to number
        },
      },
      {
        $group: {
          _id: null, // No grouping required
          totalPayslipsAmount: { $sum: "$payslipAmountAsNumber" }, // Sum converted values
        },
      },
    ]);

    // If no results, return 0
    const totalAmount = result.length > 0 ? result[0].totalPayslipsAmount : 0;
    return totalAmount;
  } catch (error) {
    console.error("Error computing invoices sum:", error);
    throw error;
  }
};

///used by update payslip
const generateSalaryExpenseItems = (payslipSalaryComponents) => {
  const salaryExpenseItems = ["Paid Basic"];
console.log(payslipSalaryComponents,'payslipSalaryComponents')
  // Add allowances if allowanceNumber !== 0
  if (Array.isArray(payslipSalaryComponents.allowances)) {
    payslipSalaryComponents.allowances.forEach((allowance) => {
      if (
        allowance.allowanceNumber !== "0" &&
        allowance.allowanceTotalValue !== 0&&
        allowance.allowanceTotalValue !== ""
      ) {
        salaryExpenseItems.push(allowance.allowanceLabel);
      }
    });
  }

  // Add deduction if deductionAmount !== 0
  const deduction = payslipSalaryComponents.deduction;
  if (deduction && deduction.deductionAmount !== 0&& deduction.deductionAmount !== "") {
    salaryExpenseItems.push(deduction.deductionLabel);
  }

  console.log(salaryExpenseItems,'salaryExpenseItems')

  return salaryExpenseItems;
};

// @desc Get all payslip
// @route GET 'desk/payslip
// @access Private // later we will establish authorisations
const getAllPayslips = asyncHandler(async (req, res) => {
  //console.log("helloooooooo");

  // Check if an ID is passed as a query parameter
  const { id, criteria, selectedYear } = req.query;
  if (id) {
    //console.log("nowwwwwwwwwwwwwwwwwwwwwww here");

    // Find a single payslip by its ID
    const payslip = await Payslip.findOne({ _id: id }).lean();

    if (!payslip) {
      return res.status(400).json({ message: "Payslip not found" });
    }

    // Return the payslip inside an array
    return res.json([payslip]); //we need it inside  an array to avoid response data error
  }

  if (selectedYear !== "1000" && criteria === "payslipsTotalStats") {
    try {
      const totalPayslipsAmount = await getPayslipsStats(selectedYear);

      return res.status(200).json({
        message: "payslips and total amount retrieved successfully",
        selectedYear,
        totalPayslipsAmount,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error retrieving payslips",
        error: error.message,
      });
    }
  }
  if (selectedYear !== "1000") {
    // Find a single payslip by its ID
    const payslips = await getPayslipsByYear(selectedYear);
    //console.log(payslips,'payslips')

    if (!payslips) {
      return res.status(400).json({ message: "Payslips not found" });
    }

    // Return the payslip inside an array
    return res.json(payslips); //we need it inside  an array to avoid response data error
  }

  // If no ID is provided, fetch all payslips
});

/////////////////////////////////checks for payslip dates
const isValidPayslipDate = (payslipYear, payslipMonth, employeeJoinDate) => {
  const currentDate = new Date();
  const [startYear, endYear] = payslipYear.split("/").map(Number);

  const payslipMonthIndex = new Date(
    `${payslipMonth} 1, ${startYear}`
  ).getMonth();

  // Calculate if the payslip month falls in the correct range of the current date
  const payslipDate = new Date(
    payslipMonthIndex >= 8 ? `${startYear}` : `${endYear}`,
    payslipMonthIndex
  );

  if (payslipDate > currentDate) {
    return {
      isValid: false,
      message: "Payslip date cannot be in the future.",
    };
  }

  // Ensure payslip date is not earlier than employee's join date
  if (payslipDate < new Date(employeeJoinDate)) {
    return {
      isValid: false,
      message: "Payslip date cannot be earlier than the employee's join date.",
    };
  }

  return { isValid: true };
};

//----------------------------------------------------------------------------------
// @desc Create new payslip
// @route POST 'desk/payslip
// @access Private
const createNewPayslip = asyncHandler(async (req, res) => {
  /////////////////new will be with no ending date
  //console.log(req?.body);
  const {
    payslipYear,
    payslipMonth,
    payslipWorkdays,
    payslipNote,
    payslipEmployee,
    payslipEmployeeName,
    payslipIsApproved,
    payslipPaymentDate,
    payslipLeaveDays,
    payslipSalaryComponents,
    payslipTotalAmount,
    employeeJoinDate,
    payslipCreator,
  } = req?.body; //this will come from front end we put all the fields o fthe collection here
  //console.log(payslipItems,'1')
  //Confirm data is present in the request with all required fields

  if (
    !payslipYear ||
    !payslipMonth ||
    !payslipEmployeeName ||
    !employeeJoinDate ||
    !payslipWorkdays ||
    !payslipEmployee ||
    !payslipSalaryComponents ||
    !payslipTotalAmount ||
    !payslipCreator
  ) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }
  //check dates are valid  no early or late payslip is being generated
  const { isValid, message } = isValidPayslipDate(
    payslipYear,
    payslipMonth,
    employeeJoinDate
  );

  if (!isValid) {
    return res.status(400).json({ message });
  }

  const payslipObject = {
    payslipYear: payslipYear,
    payslipMonth: payslipMonth,
    payslipWorkdays: payslipWorkdays,
    payslipNote: payslipNote,
    payslipEmployee: payslipEmployee,
    payslipEmployeeName: payslipEmployeeName,
    payslipIsApproved: payslipIsApproved,
    payslipPaymentDate: payslipPaymentDate,
    payslipLeaveDays: payslipLeaveDays,
    payslipSalaryComponents: payslipSalaryComponents,
    payslipTotalAmount: payslipTotalAmount,
    payslipCreator: payslipCreator,
  }; //construct new payslip to be stored

  const duplicate = await Payslip.findOne({
    payslipMonth: payslipMonth,
    payslipYear: payslipYear,
    payslipEmployee: payslipEmployee,
  });
  if (duplicate) {
    return res.status(400).json({ message: "Duplicate payslip found" });
  }
  // Create and store new payslip
  const payslip = await Payslip.create(payslipObject);
  if (!payslip) {
    return res.status(400).json({ message: "Invalid data received" });
  }
  // If created
  //console.log(payslip?.payslipItems,'2')
  return res.status(201).json({
    message: `Payslip created successfully`,
  });
});

// @desc Update a payslip
// @route PATCH 'desk/payslip
// @access Private
const updatePayslip = asyncHandler(async (req, res) => {
  ////////////update teh students while updating and creating and deleting.
  // set all other related sessions to ending date where you have a student from that payslip in any other, the latter will have an ending date
  const {
    _id,
    payslipYear,
    payslipMonth,
    payslipWorkdays,
    payslipNote,
    payslipEmployee,
    payslipEmployeeName,
    payslipIsApproved,
    payslipPaymentDate,
    payslipLeaveDays,
    payslipSalaryComponents,
    payslipTotalAmount,
    payslipOperator,
  } = req?.body;
  // console.log(
  //   _id,
  //   payslipYear,
  //   payslipMonth,
  //   payslipWorkdays,
  //   payslipNote,
  //   payslipEmployee,
  //   payslipEmployeeName,
  //   payslipIsApproved,
  //   payslipPaymentDate,
  //   payslipLeaveDays,
  //   payslipSalaryComponents,
  //   payslipTotalAmount,
  //   payslipOperator
  // );
  // Confirm data
  if (
    !_id ||
    !payslipYear ||
    !payslipMonth ||
    !payslipEmployee ||
    !payslipEmployeeName ||
    !payslipLeaveDays ||
    !payslipWorkdays ||
    !payslipSalaryComponents ||
    !payslipTotalAmount
  ) {
    return res.status(400).json({ message: "Required data is missing" });
  }
  ///no need to check the dates becasue they are not changed in the edit
  // Does the payslip exist to update?
  const payslipToUpdate = await Payslip.findById(_id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!payslipToUpdate) {
    return res.status(400).json({ message: "Payslip to update not found" });
  }

  //a check is performed here to check if a payslip is paid so we generate an expense,
  //check if payslippaymentdate is not empty and valid date, this means that payment of salary has been maid
  const { isValid } = require("date-fns"); // To validate dates
  let newExpenseObj = {};
  if (
    payslipPaymentDate &&
    isValid(new Date(payslipPaymentDate))
    //&& //new date is valid
    // payslipToUpdate.payslipPaymentDate && //date isdeifferent than existing one
    // new Date(payslipToUpdate.payslipPaymentDate).toISOString() ===
    //   new Date(payslipPaymentDate).toISOString()
  ) {
    //console.log("new expense will be generated");
    //build the expense object to be saved later

    const salaryExpenseService = await Service.findOne({
      serviceType: "Nursery",
    }).lean();
    // console.log(salaryExpenseService, "salaryExpenseService");

    const salaryExpenseCategroy = await ExpenseCategory.findOne({
      expenseCategoryLabel: "Salaries",
    }).lean();
    // console.log(salaryExpenseCategroy, "salaryExpenseCategroy");
    //console.log(payslipEmployeeName, "payslipEmployeeName");

    const salaryExpensePayee = await Payee.findOne({
      _id: payslipEmployee, //find the Payee with the same id as the employee because it was saved withthe employee like this
    }).lean();
    // console.log(salaryExpensePayee, "salaryExpensePayee");
    const salaryExpenseItems = generateSalaryExpenseItems(
      payslipSalaryComponents
    );
    //console.log(salaryExpenseItems, "salaryExpenseItems");
    const salaryExpenseAmount =
      Number(payslipTotalAmount || 0) +
      Number(payslipSalaryComponents?.deduction?.deductionAmount || 0);
    console.log(salaryExpenseAmount, "salaryExpenseAmount");

    newExpenseObj = {
      expenseYear: payslipYear,
      expenseMonth: payslipMonth,
      expenseAmount: salaryExpenseAmount,
      expenseNote: `payslip ${_id}`,
      expenseCategory: salaryExpenseCategroy._id, //always have Salaries category
      expenseItems: salaryExpenseItems,
      expensePayee: salaryExpensePayee._id,
      expenseService: salaryExpenseService._id, //always have the Nursery LAbel every year
      expenseDate: payslipPaymentDate,
      expensePaymentDate: payslipPaymentDate,
      expenseMethod:
        payslipSalaryComponents.deductionAmount === "0"
          ? "bank Transfer"
          : "Cash",
      expenseOperator: payslipOperator,
      expenseCreator: payslipOperator,
    };
  }

  payslipToUpdate.payslipYear = payslipYear;
  payslipToUpdate.payslipMonth = payslipMonth;
  payslipToUpdate.payslipEmployee = payslipEmployee;
  payslipToUpdate.payslipEmployeeName = payslipEmployeeName;
  payslipToUpdate.payslipLeaveDays = payslipLeaveDays;
  payslipToUpdate.payslipWorkdays = payslipWorkdays;
  payslipToUpdate.payslipIsApproved = payslipIsApproved;
  payslipToUpdate.payslipSalaryComponents = payslipSalaryComponents;
  payslipToUpdate.payslipTotalAmount = payslipTotalAmount;
  payslipToUpdate.payslipOperator = payslipOperator;
  payslipToUpdate.payslipPaymentDate = payslipPaymentDate;
  payslipToUpdate.payslipNote = payslipNote;

  //console.log(payslipToUpdate,'payslipToUpdate')
  const updatedPayslip = await payslipToUpdate.save(); //save old payslip
  if (!updatedPayslip) {
    return res.status(400).json({ message: "invalid data received" });
  }
  if (Object.keys(newExpenseObj).length !== 0) {
    //create teh new expense
    const createdsalaryExpense = await Expense.create(newExpenseObj);
    if (!createdsalaryExpense) {
      return res.status(400).json({
        message:
          "Payslip updated successfully but invalid data received for expense",
      });
    }
    return res.status(201).json({
      message: `Payslip updated and expense created successfully`,
    });
  }
  return res.status(201).json({
    message: `Payslip updated successfully`,
  });
});

//--------------------------------------------------------------------------------------1
// @desc Delete a student
// @route DELETE 'students/studentsParents/students
// @access Private
const deletePayslip = asyncHandler(async (req, res) => {
  ///
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the user exist to delete?
  const payslip = await Payslip.findById(id).exec();

  if (!payslip) {
    return res.status(400).json({ message: "Payslip to delete not found" });
  }

  // Delete the payslip
  const result = await payslip.deleteOne();

  const reply = `Deleted ${result?.deletedCount} payslip`;

  return res.json({ message: reply });
});

module.exports = {
  getAllPayslips,
  createNewPayslip,
  updatePayslip,
  deletePayslip,
};
