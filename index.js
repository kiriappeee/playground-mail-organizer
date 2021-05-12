const { ImapFlow } = require('imapflow');

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

let sortedMailConfig = {};
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
      console.log(msg.uid);
      console.log(msg.envelope.subject);
      console.log(msg.envelope.from);
    }
  } finally {
    console.log('Closing mailbox');
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
