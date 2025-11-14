const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class ImageHandler {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = headerConfig.imageHandler.queueName;
    this.bindingArgs = headerConfig.imageHandler.bindingArgs;
  }

  async connect() {
    try {
      console.log('Image Handler starting...');
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Assert exchange
      await this.channel.assertExchange(
        config.rabbitmq.exchange.name,
        config.rabbitmq.exchange.type,
        config.rabbitmq.exchange.options
      );

      // Assert queue
      await this.channel.assertQueue(this.queueName, {
        durable: true
      });

      // Bind queue with header arguments
      await this.channel.bindQueue(
        this.queueName,
        config.rabbitmq.exchange.name,
        '', // Routing key ignored
        this.bindingArgs
      );

      console.log(`Queue '${this.queueName}' bound with headers:`, this.bindingArgs);
      console.log('Waiting for image requests...\n');
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

          await this.processImage(content, headers);
          
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  async processImage(content, headers) {
    console.log('\nIMAGE HANDLER PROCESSING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', content.requestId);
    console.log('Image URL:', content.url);
    console.log('Size:', content.size);
    console.log('Format:', content.format);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Simulate image processing
    console.log('\nProcessing steps:');
    console.log('  1. Validating image format...');
    await this.sleep(300);
    console.log('  2. Optimizing image quality...');
    await this.sleep(300);
    console.log('  3. Generating thumbnails...');
    await this.sleep(300);
    console.log('  4. Caching in CDN...');
    await this.sleep(300);
    
    console.log('Image processing complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log('\Image Handler stopped');
  }
}

// Run the handler
async function main() {
  const handler = new ImageHandler();
  
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
