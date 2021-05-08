const { ImapFlow } = require('imapflow');

const config = require('./config.prod');
console.log(config.password)
const client = new ImapFlow({
  host: config.host,
  port: config.port,
  secure: true,
  auth:{
    user: config.username,
    pass: config.password
  },
  emitLogs: false
});

const getMail = async () => {
  await client.connect();
  console.log("Client connected");
  let lock = await client.getMailboxLock('Inbox');
  try{
    let message = await client.fetchOne('*', {
      envelope: true,
      bodyStructure: true,
    });
    console.log(message.envelope.from);
    console.log(message.bodyStructure.disposition);
  } finally {
    lock.release();
  }
  await client.logout();
  return '';
}

getMail().then((res) => {
  console.log(res);
}).catch((err) => {
  console.log(err)
})
