import { Boom } from '@hapi/boom'
import express from 'express'
import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, useSingleFileAuthState } from '../src'
import MAIN_LOGGER from '../src/Utils/logger'

const logger = MAIN_LOGGER.child({ })
logger.level = 'trace'

const port = process.env.PORT || 8000
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger })
store.readFromFile('./baileys_store_multi.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store_multi.json')
}, 10_000)

const { state, saveState } = useSingleFileAuthState('./auth_info_multi.json')

// start a connection
const startSock = async() => {
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWASocket({
		version,
		logger,
		printQRInTerminal: true,
		auth: state,
	})

	store.bind(sock.ev)

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		if(connection === 'close') {
			// reconnect if not logged out
			if((lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
				startSock()
			} else {
				console.log('Connection closed. You are logged out.')
			}
		}

		// console.log('connection update', update)
	})
	// listen for when the auth credentials is updated
	sock.ev.on('creds.update', saveState)


	app.post('/send-message', async(req, res) => {

		const number = req.body.number + '@s.whatsapp.net'
		const message = req.body.message

		// console.log(number, message)

		sock.sendMessage(number, { text: message }).then(response => {
			res.status(200).json({
			  status: true,
			  response: response
			})
		  }).catch(err => {
			res.status(500).json({
			  status: false,
			  response: err
			})
		  })
	})

	return sock
}

startSock()

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`)
})