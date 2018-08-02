/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
 module.exports = (ctx) => {
    it('validate start with clear db', async () => {
        fs.writeFileSync(config.db.file, 'Hello Node.js');
        ctx.socketPid = spawn('node', ['index.js'], {env: process.env, stdio: 'ignore'});
        await Promise.delay(10000);
    
        await Promise.all([
          (async () => {
            const client = await startClient(number);
            await new Promise(res => {
                client.onUnpackedMessage.addListener(async (getData) => {
                    expect(getData.routing).to.equal(number);
                    res();
                });
            });
            await client.close();
          })(),
          (async () => {
            await Promise.delay(1000);
            await sendMessage(number);
          })()
        ]);
    
        ctx.socketPid.kill();
      });
 }