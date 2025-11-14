const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class MobileProcessor {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = headerConfig.mobileProcessor.queueName;
    this.bindingArgs = headerConfig.mobileProcessor.bindingArgs;
  }

  async connect() {
    try {
      console.log('📱 Mobile Processor starting...');
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
      console.log('Waiting for mobile requests...\n');
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

          await this.processMobileRequest(content, headers);
          
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  async processMobileRequest(content, headers) {
    console.log('\n📱 MOBILE PROCESSOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', content.requestId);
    console.log('Device Type:', headers['device-type']);
    console.log('Content Type:', headers['content-type']);
    
    // Mobile optimizations
    console.log('\nMobile Optimizations:');
    console.log('  Compressing content for mobile bandwidth');
    console.log('  Resizing images for smaller screens');
    console.log('  Optimizing for battery consumption');
    console.log('  Adaptive quality based on connection');
    console.log('  Aggressive caching for offline mode');
    
    await this.sleep(250);
    
    console.log('\nMobile-optimized content delivered!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log('\nMobile Processor stopped');
  }
}

async function main() {
  const processor = new MobileProcessor();
  
  try {
    await processor.connect();
    await processor.consume();

    process.on('SIGINT', async () => {
      await processor.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();