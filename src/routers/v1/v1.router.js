const express = require("express")
const authRouter = require("./auth.router")
const UserRouter = require('./user.router')
const PdfRouter = require("./pdf.router")
const v1Router = express.Router()

v1Router.use("/auth", authRouter)

v1Router.use("/user", UserRouter)

v1Router.use("/indexing/pdf", PdfRouter)

module.exports = v1Router