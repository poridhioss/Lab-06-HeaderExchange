const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class VideoHandler {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = headerConfig.videoHandler.queueName;
    this.bindingArgs = headerConfig.videoHandler.bindingArgs;
  }

  async connect() {
    try {
      console.log('Video Handler starting...');
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(
        config.rabbitmq.exchange.name,
        config.rabbitmq.exchange.type,
        config.rabbitmq.exchange.options
      );

      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      await this.channel.bindQueue(
        this.queueName,
        config.rabbitmq.exchange.name,
        '',
        this.bindingArgs
      );

      console.log(`Queue '${this.queueName}' bound with headers:`, this.bindingArgs);
      console.log('Waiting for video requests...\n');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async consume() {
    this.channel.consume(
      this.queueName,
      async (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          const headers = msg.properties.headers;

          await this.processVideo(content, headers);
          
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  async processVideo(content, headers) {
    console.log('\nVIDEO HANDLER PROCESSING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', content.requestId);
    console.log('Video URL:', content.url);
    console.log('Duration:', content.duration);
    console.log('Quality:', content.quality);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Simulate video processing
    console.log('\nProcessing steps:');
    console.log('  1. Validating video codec...');
    await this.sleep(400);
    console.log('  2. Transcoding to multiple formats...');
    await this.sleep(400);
    console.log('  3. Generating adaptive bitrate streams...');
    await this.sleep(400);
    console.log('  4. Creating preview thumbnails...');
    await this.sleep(400);
    console.log('  5. Distributing to edge servers...');
    await this.sleep(400);
    
    console.log('Video processing complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log('\nVideo Handler stopped');
  }
}

async function main() {
  const handler = new VideoHandler();
  
  try {
    await handler.connect();
    await handler.consume();

    process.on('SIGINT', async () => {
      await handler.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
