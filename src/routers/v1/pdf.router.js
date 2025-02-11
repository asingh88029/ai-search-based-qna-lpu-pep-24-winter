const express = require("express")
const { IndexNewPDFController } = require("./../../controllers/pdf.controller")
const {PdfUploadMiddleware} = require("./../../middlewares/multer.middleware")
const {AuthenticationMiddleware, AuthoriztionMiddlewareGenerator} = require("./../../middlewares/auth.middleware")

const pdfRouter = express.Router()

pdfRouter.post("/new", AuthenticationMiddleware, AuthoriztionMiddlewareGenerator("ORG_ADMIN"), PdfUploadMiddleware.single('data'), IndexNewPDFController)

module.exports = pdfRouter