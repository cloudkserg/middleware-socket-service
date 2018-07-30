const EventEmitter = require('events');

const MESSAGE = 'message';

class AmqpServer extends EventEmitter
{

  constructor(config) {
    this.uri  = config.uri
    this.exchange = config.exchange
    this.serviceName = config.serviceName
    this.MESSAGE = MESSAGE
    super();
  }


  async start () {
    const amqpInstance = await amqp.connect(config.rabbit.url);

    this.channel = await amqpInstance.createChannel();
    this.channel.on('close', () => {
      throw new Error('rabbitmq process has finished!');
    });
  }


  async addBind(routing) {
    await this.channel.bindQueue(`${this.serviceName}.${routing}`, this.exchange, routing);
    this.channel.consume(`${this.serviceName}.${routing}`, async (data) => {  

      this.emit(this.MESSAGE, {
        routing: routing,
        data: JSON.parse(data.content)
      })
      channel.ack(data);
    });
  }

  delBind(routing) {
    await this.channel.cancel(`${this.serviceName}.${routing}`);
  }

}

module.exports = AmqpServer;