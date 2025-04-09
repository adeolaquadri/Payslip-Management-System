import express from "express"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()
const app = express()

app.use(cors({
   credentials: true,
   origin: "http://localhost:3030"
}))
app.use(express.json())

const port = process.env.PORT


app.listen(port, ()=>{console.log(`App is listening to port ${port}`)})