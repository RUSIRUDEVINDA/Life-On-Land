import { connectDB } from "./config/db.js"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()

connectDB()

app.use(cors())

app.use(express.json())

app.get('/', (req, res) => {
    res.send('This is the backend server for Life on Land')
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})