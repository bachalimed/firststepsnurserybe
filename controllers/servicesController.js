const Service = require("../models/Service");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all services
// @route GET '/settings/academicsSet/services/'            ??how to modify this route to admin/services is in serve.js and serviceRoutes
// @access Private // later we will establish authorisations
const getAllServices = asyncHandler(async (req, res) => {
  const {id, selectedYear} = req?.query
  //console.log('teh request', req.query)
 
 
  //console.log(selectedYear, "sleected year inback")
  //will retrive all teh services
  if (selectedYear === '1000'){
      const services = await Service.find().lean()
      if (!services?.length) {
          return res.status(400).json({ message: 'No services found!' })
      }else{
      //console.log('returned res', services)

      return res.json(services)}
    }
    if(id){
      const {id} = req.query
      const service = await Service.find({ _id: id }).lean()//this will not return the extra data(lean)//removed populate father and mother
  
  //console.log('with id  select')
  if (!service?.length) {
      return res.status(400).json({ message: 'No service found for the Id provided' })
  }
  //console.log('returned res', service)
  return res.json(service)

  }

   if (selectedYear!=="1000"){
  //will retrieve only the selcted year
          const services = await Service.find({ serviceYear:selectedYear }).lean()//this will not return the extra data(lean)
          
          //console.log('with year select',selectedYear, services)
          if (!services?.length) {
              return res.status(400).json({ message: 'No services found  for the selected academic year' })
          }else{
          //console.log('returned res', services)
           return res.json(services)}
        }
  //will retreive according to the id
 else {
  const services = await Service.find().lean()//this will not return the extra data(lean)
  //console.log('with no select')
  if (!services?.length) {
      return res.status(400).json({ message: 'No services found' })
  }
  //console.log('returned res', services)
  res.json(services)}

  // If no services 
 
  //res.json(services)
})

//----------------------------------------------------------------------------------
// @desc Create new service
// @route POST '/settings/academicsSet/services/'
// @access Private
const createNewService = asyncHandler(async (req, res) => {
 
  const  { serviceType, serviceYear, serviceAnchor, serviceCreator, serviceOperator } = req?.body

  //Confirm data is present in the request with all required fields
  if (!serviceType || !serviceYear || !serviceAnchor  || !serviceCreator || !serviceOperator) {
    return res.status(400).json({ message: "Required data is missing" }); //400 : bad request
  }

  // Check for duplicate servicename
  // Check for duplicate service
const duplicate = await Service.findOne({ serviceYear, serviceType }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: `  ${serviceType} service ${serviceYear} found ` });
  }

  const serviceObject = { serviceType, serviceYear, serviceAnchor, serviceCreator, serviceOperator }; //construct new service to be stored

  // Create and store new service
  const service = await Service.create(serviceObject);

  if (service) {
    //if created
    res
      .status(201)
      .json({ message: `Service created successfully` });
  } else {
    res.status(400).json({ message: "Invalid data received" });
  }
});

// @desc Update a service
// @route PATCH '/settings/academicsSet/services/'
// @access Private
const updateService = asyncHandler(async (req, res) => {
  const { serviceId, serviceType, serviceYear, serviceAnchor,  serviceOperator } = req.body;

  // Confirm data
  if (!serviceId || !serviceType || !serviceYear || !serviceAnchor || !serviceOperator) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the service exist to update?
  const service = await Service.findById(serviceId).exec(); //we did not lean becausse we need the save method attached to the response

  if (!service) {
    return res.status(400).json({ message: "Academic Year not found" });
  }

  // Check for duplicate
  const duplicate = await Service.findOne({ serviceYear, serviceType }).lean().exec();

  // Allow updates to the original service
  if (duplicate && duplicate?._id.toString() !== serviceId) {
    return res.status(409).json({ message: "Duplicate service Type for the academic Year" });
  }

  service.serviceType = serviceType; //it will only allow updating properties that are already existant in the model
  service.serviceYear = serviceYear;
  service.serviceAnchor = serviceAnchor;
  service.serviceOperator = serviceOperator;

  const updatedService = await service.save(); //save method received when we did not include lean

  return res.json({ message: `Service updated successfully` });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a service
// @route DELETE '/settings/academicsSet/services/'
// @access Private
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Required data is missing" });
  }

  // Does the service still have assigned notes?
  // const note = await Note.findOne({ service: id }).lean().exec()
  // if (note) {
  //     return res.status(400).json({ message: 'Service has assigned notes' })
  // }

  // Does the service exist to delete?
  const service = await Service.findById(id).exec();

  if (!service) {
    return res.status(400).json({ message: "Academic Year not found" });
  }

  const result = await service.deleteOne();
console.log(result, 'result')
  const reply = `deleted ${result.deletedCount} Service: Name ${service.servicename} with ID ${service._id} `;

  res.json(reply);
});

module.exports = {
  getAllServices,
  createNewService,
  updateService,
  deleteService,
};
