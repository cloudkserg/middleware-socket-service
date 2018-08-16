/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const EventEmitter = require('events'),
  amqp = require('amqplib');

const MESSAGE = 'message';

/**
 * Class for subscribe on amqp events 
 * from other middlewares
 * listen only selected messages
 * 
 * @class AmqpServer
 * @extends {EventEmitter}
 */
class AmqpServer extends EventEmitter
{
  /**
   * 
   * constructor
   * @param {Object} config
   * options are:
   * url - url for rabbit
   * exchange - name exchange in rabbit
   * serviceName - service name of queue in rabbit
   * 
   * @memberOf AmqpServer
   */
  constructor (config) {
    super();
    this.url  = config.url;
    this.exchange = config.exchange;
    this.serviceName = config.serviceName;
    this.MESSAGE = MESSAGE;
  }


  /**
   * function for start (connect to rabbit)
   * 
   * @memberOf AmqpServer
   */
  async start () {
    this.amqpInstance = await amqp.connect(this.url);

    this.channel = await this.amqpInstance.createChannel();
    this.channel.on('close', () => {
      throw new Error('rabbitmq process has finished!');
    });
  }


  /**
   * function to subscribe to this channel
   * 
   * @param {String} routing 
   * 
   * @memberOf AmqpServer
   */
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

  /**
   * function to unsubscribe from this channel
   * 
   * @param {String} routing 
   * 
   * @memberOf AmqpServer
   */
  async delBind (routing) {
    await this.channel.cancel(`${this.serviceName}.${routing}`);
  }

  /**
   * Function for close connection to rabbitmq
   * 
   * 
   * @memberOf AmqpServer
   */
  async close () {
    await this.amqpInstance.close();
  }

}

module.exports = AmqpServer;
