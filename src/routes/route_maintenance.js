const express = require('express');
const route = express.Router();

const mainController = require("../controller/mainController");

route.get("/",mainController.maintenance)
route.get("/maintenance",mainController.maintenance)
route.post("/launchJVM",mainController.maintenance)
route.post("/sendEmail", mainController.maintenance)
route.post("/addSatisfactionFile", mainController.maintenance)

route.all("/*", function (req, res) {
    res.status(400).send({status: false,message: "The api you request is not available"})
})
module.exports = route;
