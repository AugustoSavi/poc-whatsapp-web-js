# ApiSendMessage para WhatsApp

## :information_source: References

https://github.com/adiwajshing/Baileys
https://github.com/pedroherpeto/bot-api-zapdasgalaxias/blob/main/app.js
https://github.com/pedroherpeto/bot-api-zapdasgalaxias

## :information_source: How to execute
```
// Access the dir:
$ cd BotCobrancaCA/

// install de dependencies
$ npm install

// start de app
$ npm start

```

## :information_source: Exemple de curl

```
curl --request POST \
  --url http://localhost:8000/send-message \
  --header 'Content-Type: application/json' \
  --data '{
	"number": "5588123456789",
	"message": "🤣🤣BOA NOITE🤣🤣"
}'
```