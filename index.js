import qrcode from "qrcode-terminal"
import whatsappWebJS from "whatsapp-web.js"

const { Client, LocalAuth, Buttons } = whatsappWebJS;

const GROUP_NAME = 'GrupoTesteBot'

const client = new Client({
	authStrategy: new LocalAuth()
});

// generate qrcode
client.on('qr', qr => {
	qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
	console.log('Client is ready!');
	await sendMessageToPeopleOfGroup();
});

client.on('message', async message => {
	console.log(message);
	if (message.type === 'buttons_response') {
		if (message.body === 'Gostaria de continuar') {
			message.reply('Certo, muito obrigado pela sua atenção');
		}

		if (message.body === 'Pode me remover') {
			message.reply('Certo, muito obrigado pela sua atenção, dentro de alguns instantes você será removido');

			const chats = await client.getChats();
			const group = chats.find(chat => chat.isGroup && chat.name === GROUP_NAME);

			if (group) {
				group.removeParticipants([message.from])
			}
		}
	}
});

async function sendMessageToPeopleOfGroup(){
	const chats = await client.getChats();
	const group = chats.find(chat => chat.isGroup && chat.name === GROUP_NAME);
	
	console.log('group: ' + group.name);

	if (group) {
		const participants = await group.participants;
		const contacts = participants.map(participant => participant.id._serialized);
		console.log(`contacts do grupo ${GROUP_NAME}: ` + contacts);

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
				`Olá! Sou o chatbot do admin do grupo ${GROUP_NAME}, estou entrando em contato pois estamos no inicio do semeste e precisamos limpar o grupo para adicionar os novos alunos... \n\n Ai gostaria de saber se você gostaria de continuar no grupo ${GROUP_NAME}?`,
				buttons,
				`Questionário sobre o grupo ${GROUP_NAME}`,
				''
			);

			console.log(`sendMessage to: ${contact}, message: ${message}`);
			await client.sendMessage(contact, message);
		}
	} else {
		console.log('Grupo não encontrado');
	}
}

client.initialize();
