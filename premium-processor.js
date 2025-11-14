const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class PremiumProcessor {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.queueName = headerConfig.premiumProcessor.queueName;
    this.bindingArgs = headerConfig.premiumProcessor.bindingArgs;
  }

  async connect() {
    try {
      console.log('Premium Processor starting...');
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

      // Bind with premium user tier header
      await this.channel.bindQueue(
        this.queueName,
        config.rabbitmq.exchange.name,
        '',
        this.bindingArgs
      );

      console.log(`Queue '${this.queueName}' bound with headers:`, this.bindingArgs);
      console.log('Waiting for premium user requests...\n');
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

          await this.processPremiumRequest(content, headers);
          
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  async processPremiumRequest(content, headers) {
    console.log('\nPREMIUM PROCESSOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', content.requestId);
    console.log('User Tier:', headers['user-tier']);
    console.log('Content Type:', headers['content-type']);
    console.log('Region:', headers['region']);
    
    // Premium features
    console.log('\nPremium Features Enabled:');
    console.log('  Priority processing queue');
    console.log('  Higher bandwidth allocation');
    console.log('  Advanced caching');
    console.log('  24/7 support');
    console.log('  Analytics dashboard');
    
    await this.sleep(200);
    
    console.log('\nPremium request processed with priority!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log('\nPremium Processor stopped');
  }
}

async function main() {
  const processor = new PremiumProcessor();
  
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
