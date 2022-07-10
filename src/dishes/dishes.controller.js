const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Lists existing dishes
function list(req, res) {
    res.json({ data: dishes });
  }

function validateDishProperties(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  let errorMessage;

  if (!name || name === "") errorMessage = "Dish must include a name";
  else if (!description || description === "")
  errorMessage = "Dish must include a description";
  else if (!price) errorMessage = "Dish must include a price";
  else if (price <= 0 || !Number.isInteger(price))
  errorMessage = "Dish must have a price that is an integer greater than 0";
  else if (!image_url || image_url === "")
  errorMessage = "Dish must include a image_url";

  if (errorMessage) {
    return next({
      status: 400,
      message: errorMessage,
    });
  }

  next();
}

//Create new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//Checks if dish exists
function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  res.locals.dishId = dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${req.params.dishId}`,
  });
}

//Reads data requested
function read(req, res) {
  res.json({ data: res.locals.dish });
}

//Update existing dish
function update(req, res) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  res.locals.dish = {
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  if ((id && id === res.locals.dishId) || !id) {
    res.locals.dish.id = res.locals.dishId;
    return res.json({ data: res.locals.dish });
  } else {
    return res
      .status(400)
      .json({
        error: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dishId}`,
      });
  }
}

module.exports = {
  create: [validateDishProperties, create],
  read: [dishExists, read],
  update: [dishExists, validateDishProperties, update],
  list,
};