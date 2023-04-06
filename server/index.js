
const express = require("express")
const app = express()
require("dotenv").config()
const server = require("http").createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

io.on("connection", (socket) => {
    console.log("a user is connected...")
    socket.on("sdp", (data) => {
        console.log({ data })
        socket.broadcast.emit("data", data)
    })
    socket.on("candidate",(data)=>{
        console.log({data})
        socket.broadcast.emit("candidate",data)
    })
})

const PORT = process.env.port || 6600
app.get("/", (req, res) => {
    return res.send("hii")
})

server.listen(PORT, (err) => {
    console.log("server is start", PORT)
})