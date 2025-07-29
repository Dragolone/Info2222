import { createServer } from 'https'
import { Server } from 'socket.io'
import next from 'next'
import fs from 'fs'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const PORT = process.env.PORT || 3001

app.prepare().then(() => {
  const options = {
    key: fs.readFileSync('./certs/localhost-key.pem'),
    cert: fs.readFileSync('./certs/localhost.pem'),
  }
  const httpsServer = createServer(options, (req, res) => {
    handle(req, res)
  })

  const io = new Server(httpsServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', socket => {
    console.log('🔌 Client connected:', socket.id)

    socket.on('join', userId => {
      console.log('👤 User joined:', userId)
      socket.join(userId)
    })

    socket.on('message', payload => {
      console.log('📨 Message received:', payload)
      io.to(payload.receiverId).emit('message', payload)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })
  })

  httpsServer.listen(PORT, () => {
    console.log(`🚀 Server running on https://localhost:${PORT}`)
  })
})
