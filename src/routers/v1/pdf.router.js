const express = require("express")
const { IndexNewPDFController } = require("./../../controllers/pdf.controller")
const {PdfUploadMiddleware} = require("./../../middlewares/multer.middleware")

const pdfRouter = express.Router()

// TODO : We have to setup Authentication , Authorization middleware
pdfRouter.post("/new", PdfUploadMiddleware.single('data'), IndexNewPDFController)

module.exports = pdfRouter