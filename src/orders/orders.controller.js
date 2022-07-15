const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Lists existing orders
function list(req, res) {
    res.json({ data: orders });
  }

function validateDeliveryToProperties(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    let errorMessage;
  
    if (!deliverTo || deliverTo === "")
    errorMessage = "Order must include a deliverTo";
    else if (!mobileNumber || mobileNumber === "")
    errorMessage = "Order must include a mobileNumber";
    else if (!dishes) errorMessage = "Order must include a dish";
    else if (!Array.isArray(dishes) || dishes.length === 0)
    errorMessage = "Order must include at least one dish";
    else {
      for (let i = 0; i < dishes.length; i++) {
        if (
          !dishes[i].quantity ||
          dishes[i].quantity <= 0 ||
          !Number.isInteger(dishes[i].quantity)
        )
        errorMessage = `Dish ${i} must have a quantity that is an integer greater than 0`;
      }
    }
  
    if (errorMessage) {
      return next({
        status: 400,
        message: errorMessage,
      });
    }
  
    next();
  }
  
  //Creates new order
  function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      status: status ? status: "pending",
      dishes: dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }
  
  //Checks if order exists
  function validateOrderId(req, res, next) {
    const orderId = req.params.orderId;
    res.locals.orderId = orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${req.params.orderId}`,
    });
  }
  
  //Reads order requested
  function read(req, res) {
    res.json({ data: res.locals.order });
  }
  
  //Keeps orderId from being overwritten
function validateOrderBodyId(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id || id === orderId) {
    res.locals.orderId = orderId;
    return next();
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
  });
}

//Makes sure order is valid
function statusValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  let errorMessage;

  if (
    !status ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  )
    errorMessage =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  else if (status === "delivered")
    errorMessage = "A delivered order cannot be changed";

  if (errorMessage) {
    return next({
      status: 400,
      message: errorMessage
    });
  }

  next();
}

//Updates existing order
function update(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  res.locals.order = {
    id: res.locals.orderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes
  };
  res.json({ data: res.locals.order });
}

//Deletes an order
function destroy(req, res) {
  const index = orders.indexOf(res.locals.order);

  if (res.locals.order.status !== "pending") {
    return res.status(400).json({
      error: "An order cannot be deleted unless it is pending"
    });
  } else {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
}

module.exports = {
  create: [validateDeliveryToProperties, create],
  read: [validateOrderId, read],
  update: [
    validateOrderId,
    validateOrderBodyId,
    validateDeliveryToProperties,
    statusValid,
    update
  ],
  delete: [validateOrderId, destroy],
  list
};
