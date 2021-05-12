const { ImapFlow } = require('imapflow');
const prompt = require('prompt');
const fs = require('fs');
const config = require('./config.prod');
const client = new ImapFlow({
  host: config.host,
  port: config.port,
  secure: true,
  auth:{
    user: config.username,
    pass: config.password
  },
  logger: {}
});

let sortedMailConfig = JSON.parse(fs.readFileSync('sorted-mail.json'))
let ignoreMail = {}
const getMail = async () => {
  console.log('Connecting to client')
  await client.connect();
  console.log("Client connected");
  console.log('Opening inbox')
  let mailbox = await client.mailboxOpen('Inbox');
  console.log('Inbox opened');
  try{
    console.log('Fetching single mail');
    let message = await client.fetchOne("*", {
      envelope: true,
    });
    console.log(message.envelope.from);
    console.log('Fetching all unread mail');
    for await (let msg of client.fetch('1:*', {envelope: true})){
      fromAddress = msg.envelope.from[0].address
      console.log(`-----------------------------------------------------------
UID: ${msg.uid}, Seq: ${msg.seq}

Subject: "${msg.envelope.subject}"

Sender: ${msg.envelope.from[0].name} (${msg.envelope.from[0].address})`);
      prompt.start();
      prompt.message = '';
      if (sortedMailConfig[fromAddress] === undefined && ignoreMail[fromAddress] === undefined){
        let { screenOption } = await prompt.get({
          name: 'screenOption',
          description: `What do you want to do for this sender?
  o (screen out)
  c(screen to conversations)
  f (screen to feed)
  p (screen to paper trail)
  i (ignore for now)`
        });
        if (screenOption !== 'i') {
          sortedMailConfig[msg.envelope.from[0].address] = screenOption;
        } else {
          ignoreMail[msg.envelope.from[0].address] = screenOption;
        }
      } else {
        if (sortedMailConfig[fromAddress] !== undefined) {
          console.log(`Option chosen for the sender is ${sortedMailConfig[msg.envelope.from[0].address]}`)
        } else {
          console.log('Choosing to ignore this sender for this session');
        }
      }
    }
  } finally {
    fs.writeFileSync('sorted-mail.json', JSON.stringify(sortedMailConfig));
    console.log('\nClosing mailbox');
    await client.mailboxClose();
    console.log('Mailbox closed');
  }
  await client.logout();
  return '';
}

getMail().then((res) => {
  console.log(res);
}).catch((err) => {
  console.log(err)
})
