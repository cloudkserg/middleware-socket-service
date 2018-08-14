/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  amqp = require('amqplib');

const MESSAGE = 'message';

class AmqpServer extends EventEmitter
{
  constructor (config) {
    super();
    this.url  = config.url;
    this.exchange = config.exchange;
    this.serviceName = config.serviceName;
    this.MESSAGE = MESSAGE;
  }


  async start () {
    this.amqpInstance = await amqp.connect(this.url);

    this.channel = await this.amqpInstance.createChannel();
    this.channel.on('close', () => {
      throw new Error('rabbitmq process has finished!');
    });
  }


  async addBind (routing) {
    await this.channel.assertQueue(`${this.serviceName}.${routing}`);
    await this.channel.bindQueue(`${this.serviceName}.${routing}`, this.exchange, routing);
    this.channel.consume(`${this.serviceName}.${routing}`, async (data) => {
      this.emit(this.MESSAGE, {
        routing: data.fields.routingKey,
        data: JSON.parse(data.content)
      });
      this.channel.ack(data);
    });
  }

  async delBind (routing) {
    await this.channel.cancel(`${this.serviceName}.${routing}`);
  }

  async close () {
    await this.amqpInstance.close();
  }

}

module.exports = AmqpServer;
