const { WAConnection, MessageType, MessageOptions, Mimetype } = require('@adiwajshing/baileys');
const fs = require('fs');
const express = require('express');
const http = require('http');
const app = express();
const port = process.env.PORT || 8000;
const server = http.createServer(app);
const { body, validationResult } = require('express-validator');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function connectToWhatsApp() {
  const conn = new WAConnection()
  conn.on('open', () => {
    // save credentials whenever updated
    console.log(`credentials updated!`)
    const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
    fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
  })
  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of chats!
  conn.on('chats-received', async ({ hasNewChats }) => {
    console.log(`you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`)
    const unread = await conn.loadAllUnreadMessages()
    console.log("you have " + unread.length + " unread messages")
  })
  // called when WA sends chats
  // this can take up to a few minutes if you have thousands of contacts!
  conn.on('contacts-received', () => {
    console.log('you have ' + Object.keys(conn.contacts).length + ' contacts')
  })
  if (fs.existsSync('./auth_info.json')) {
    conn.loadAuthInfo('./auth_info.json') // will load JSON credentials from file
    await conn.connect()
  } else {
    await conn.connect()
  }
  conn.on('chat-update', async chatUpdate => {
    if (chatUpdate.messages && chatUpdate.count) {
      const message = chatUpdate.messages.all()[0];
      console.log(JSON.stringify(message));
    }
  })

  app.post('/send-list', async (req, res) => {

    const number = req.body.number;
    const row1 = req.body.row1;
    const row2 = req.body.row2;
    const description1 = req.body.description1;
    const description2 = req.body.description2;
    const title = req.body.title;
    const buttonText = req.body.buttonText;
    const description = req.body.description;

    // send a list message!
    const rows = [
      { title: row1, description: description1, rowId: "rowid1" },
      { title: row2, description: description2, rowId: "rowid2" }
    ]

    const sections = [{ title: title, rows: rows }]

    const button = {
      buttonText: buttonText,
      description: description,
      sections: sections,
      listType: 1
    }

    const sendMsg = await conn.sendMessage(number + '@s.whatsapp.net', button, MessageType.listMessage)
      .then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Mensagem não enviada',
          response: err.text
        });
      });

  })


  app.post('/send-image', async (req, res) => {

    const number = req.body.number;
    const filePath = req.body.filePath;
    const caption = req.body.caption;
    const extension = filePath.split(".")[1];
    if (extension === "png") {
      const sentMsg = await conn.sendMessage(number + '@s.whatsapp.net', fs.readFileSync("./" + filePath), MessageType.image, { mimetype: Mimetype.png, caption: caption })
        .then(response => {
          res.status(200).json({
            status: true,
            message: 'Mensagem enviada',
            response: response
          });
        }).catch(err => {
          res.status(500).json({
            status: false,
            message: 'Mensagem não enviada',
            response: err.text
          });
        });
    }
    else if (extension === "jpeg") {
      const sentMsg = await conn.sendMessage(number + '@s.whatsapp.net', fs.readFileSync("./" + filePath), MessageType.image, { mimetype: Mimetype.jpeg, caption: caption })
        .then(response => {
          res.status(200).json({
            status: true,
            message: 'Mensagem enviada',
            response: response
          });
        }).catch(err => {
          res.status(500).json({
            status: false,
            message: 'Mensagem não enviada',
            response: err.text
          });
        });
    }

  })


  app.post('/send-message', [
    body('number').notEmpty(),
    body('message').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });
  
    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }
  
    const number = req.body.number + '@s.whatsapp.net';
    const message = req.body.message;
  
    conn.sendMessage(number, message, MessageType.text).then(response => {
      res.status(200).json({
        status: true,
        response: response
      });
    }).catch(err => {
      res.status(500).json({
        status: false,
        response: err
      });
    });
  });
  
}

// run in main file
connectToWhatsApp()
  .catch(err => console.log("unexpected error: " + err)) // catch any errors

server.listen(port, function () {
  console.log('App running on *: ' + port);
});