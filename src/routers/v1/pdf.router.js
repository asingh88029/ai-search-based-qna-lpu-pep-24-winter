const express = require("express")
const { IndexNewPDFController } = require("./../../controllers/pdf.controller")

const pdfRouter = express.Router()

// TODO : We have to setup Authentication , Authorization middleware
pdfRouter.post("/new", IndexNewPDFController)

module.exports = pdfRouter