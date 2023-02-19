import fs from "fs"
import qrcode from "qrcode-terminal"
import whatsappWebJS from "whatsapp-web.js"

const { Client, LocalAuth, Buttons } = whatsappWebJS;

const client = new Client({
	authStrategy: new LocalAuth()
});

// generate qrcode
client.on('qr', qr => {
	qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
	console.log('Client is ready!');

	const groupName = 'grupo do chat bot';
	const chats = await client.getChats();
	const group = chats.find(chat => chat.isGroup && chat.name === groupName);
	if (group) {
		const participants = await group.participants;
		const contacts = participants.map(participant => participant.id._serialized);
		console.log(contacts);

		for (const contact of contacts) {
			const buttons = [
				{
					body: 'Gostaria de continuar'
				},
				{
					body: 'Pode me remover'
				}
			];
			const message = new Buttons(
				`Olá! Sou o chatbot do admin do grupo ${groupName}, estou entrando em contato pois estamos no inicio do semeste e precisamos limpar o grupo para adicionar os novos alunos... \n\n Ai gostaria de saber se você gostaria de continuar no grupo ${groupName}?`,
				buttons,
				`Questionário sobre o grupo ${groupName}`,
				''
			);

			client.sendMessage(contact, message);
		}
	} else {
		console.log('Grupo não encontrado');
	}
});

client.on('message', message => {
	console.log(message);
	if (message.type === 'buttons_response') {
		if(message.body === 'Gostaria de continuar'){
			message.reply('certo, muito obrigado pela pela sua contribuição');
		}

		if(message.body === 'Pode me remover'){
			message.reply('certo, dentro de alguns dias vc será removido');
		}
	}
});

client.initialize();
