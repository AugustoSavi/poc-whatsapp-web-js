import fs from "fs"
import qrcode from "qrcode-terminal"
import  whatsappWebJS from "whatsapp-web.js"

const { Client, LocalAuth } = whatsappWebJS;

const client = new Client({
    authStrategy: new LocalAuth()
});

// generate qrcode
client.on('qr', qr => {
	qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
	console.log('Client is ready!');
});

client.on('message', message => {
	console.log(message);
	if (message.body === '!ping') {
		message.reply('pong');
	}
});

client.initialize();
