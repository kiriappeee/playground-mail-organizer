const { ImapFlow } = require('imapflow');
const fs = require('fs');
const config = require('./config.prod');
const { message } = require('prompt');
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

// Load the config
let sortedMailConfig = JSON.parse(fs.readFileSync('sorted-mail.json'))
// Get the unread mail in the inbox
const sortMail = async () => {
  console.log('Connecting to client')
  await client.connect();
  console.log("Client connected");
  console.log('Opening inbox')
  await client.mailboxOpen('Inbox');
  console.log('Inbox opened');
  try {
    let organizedMessages = []
    for await (let message of client.fetch('1:*', {envelope: true})){
      const fromAddress = message.envelope.from[0].address
      let formattedMessageDetails = `-----------------------------------------------------------
  UID: ${message.uid}, Seq: ${message.seq}

  Subject: "${message.envelope.subject}"

  Sender: ${message.envelope.from[0].name} (${message.envelope.from[0].address})`;
      organizedMessages.push({
        uid: message.uid.toString(),
        sender: fromAddress,
        formattedDetails: formattedMessageDetails
      })
    }
    console.log('All messages read. Now organizing');
    console.log(organizedMessages);
    // sort based on config
    // Mails not marked as conversations are marked as read
    // before moving them into their relevant folder
    for (let i = 0; i<organizedMessages.length; i++){
      const fromAddress = organizedMessages[i].sender;
      const uid = organizedMessages[i].uid;
      console.log(organizedMessages[i].formattedDetails);
      if (sortedMailConfig[fromAddress] !== undefined){
        let sortConfig = sortedMailConfig[fromAddress];
        if (sortConfig === 'o'){
          console.log('Screened out');
          console.log(uid);
          console.log('Marking message as read');
          await client.messageFlagsAdd(uid,
          ['\\Seen'],
          {uid:true});
          console.log('Moving message to Screened out folder');
          await client.messageMove(uid,
          'Screened out',
          {uid: true});
        } else if (sortConfig === 'f'){
          console.log('To the feed');
          console.log('Marking message as read');
          await client.messageFlagsAdd(uid,
          ['\\Seen'],
          {uid:true});
          console.log('Moving message to feed folder');
          await client.messageMove(uid,
          'Feed',
          {uid: true});
        } else if (sortConfig === 'p'){
          console.log('To the paper trail');
          console.log('Marking message as read');
          await client.messageFlagsAdd(uid,
          ['\\Seen'],
          {uid:true});
          console.log('Moving message to paper trail folder');
          await client.messageMove(uid,
          'Paper Trail',
          {uid: true});
        } else if (sortConfig === 'c'){
          console.log('To conversations');
          console.log('Moving message to conversations folder');
          await client.messageMove(uid,
          'Conversations',
          {uid: true});
        } else {
          console.log('Message is ignored for now');
        }
      }
    }
  } catch (err) {
    console.log(err)
  } finally {
    await client.mailboxClose();
    await client.logout();
    return '';
  }
};

sortMail().then((res) => {
  console.log(res)
}).catch((err) => {
  console.log(err)
})
