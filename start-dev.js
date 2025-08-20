const { createDevServerMiddleware } = require("@expo/dev-server")
const express = require("express")

const app = express()
const port = 8081

// Add dev server middleware
app.use(createDevServerMiddleware())

app.listen(port, () => {
  console.log(`Development server running on http://localhost:${port}`)
  console.log("Open this URL in your browser or Expo Go app")
})
