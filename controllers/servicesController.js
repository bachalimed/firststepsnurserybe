const Service = require("../models/Service");

//const Employee = require('../models/Employee')//we might need the employee module in this controller
const asyncHandler = require("express-async-handler"); //instead of using try catch

const mongoose = require("mongoose");

// @desc Get all services
// @route GET '/settings/academicsSet/services/'            ??how to modify this route to admin/services is in serve.js and serviceRoutes
// @access Private // later we will establish authorisations
const getAllServices = asyncHandler(async (req, res) => {
  // Get all services from MongoDB
  //console.log('teh request', req.query)
  if(req.query?.selectedYear){
  const {selectedYear} = req.query//maybe replace the conditionals with the current year that we get  from middleware
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
    else{
  //will retrieve only the selcted year
          const services = await Service.find({ serviceYear:selectedYear }).lean()//this will not return the extra data(lean)
          
          console.log('with year select',selectedYear, services)
          if (!services?.length) {
              return res.status(400).json({ message: 'No services found  for the selected academic year' })
          }else{
          //console.log('returned res', services)
           return res.json(services)}
        }
  //will retreive according to the id
  }else if(req.query?.id){
      const {id} = req.query
      const service = await Service.find({ _id: id }).lean()//this will not return the extra data(lean)//removed populate father and mother
  
  //console.log('with id  select')
  if (!service?.length) {
      return res.status(400).json({ message: 'No service found for the Id provided' })
  }
  //console.log('returned res', service)
  res.json(service)

  }else {
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
  const { title, yearStart, yearEnd, serviceCreator } = req.body; //this will come from front end we put all the fields o fthe collection here

  //Confirm data is present in the request with all required fields
  if (!title || !yearStart || !yearEnd || !serviceCreator) {
    return res.status(400).json({ message: "All fields are required" }); //400 : bad request
  }

  // Check for duplicate servicename
  const duplicate = await Service.findOne({ yearStart }).lean().exec(); //because we re receiving only one response from mongoose

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate service" });
  }

  const serviceObject = { title, yearStart, yearEnd, serviceCreator }; //construct new service to be stored

  // Create and store new service
  const service = await Service.create(serviceObject);

  if (service) {
    //if created
    res
      .status(201)
      .json({ message: `New academic Year ${service.title} created` });
  } else {
    res.status(400).json({ message: "Invalid academic Year data received" });
  }
});

// @desc Update a service
// @route PATCH '/settings/academicsSet/services/'
// @access Private
const updateService = asyncHandler(async (req, res) => {
  const { id, title, yearStart, yearEnd, serviceCreator } = req.body;

  // Confirm data
  if (!id || !title || !yearStart || !yearEnd || !serviceCreator) {
    return res.status(400).json({ message: "All fields  are required" });
  }

  // Does the service exist to update?
  const service = await Service.findById(id).exec(); //we did not lean becausse we need the save method attached to the response

  if (!service) {
    return res.status(400).json({ message: "Academic Year not found" });
  }

  // Check for duplicate
  const duplicate = await Service.findOne({ title }).lean().exec();

  // Allow updates to the original service
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate academic Year" });
  }

  service.title = title; //it will only allow updating properties that are already existant in the model
  service.yearStart = yearStart;
  service.yearEnd = yearEnd;

  service.serviceCreator = serviceCreator;

  const updatedService = await service.save(); //save method received when we did not include lean

  res.json({ message: `${updatedService.servicename} updated` });
});
//--------------------------------------------------------------------------------------1
// @desc Delete a service
// @route DELETE '/settings/academicsSet/services/'
// @access Private
const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "Academic Year ID Required" });
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
