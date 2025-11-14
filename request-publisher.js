const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class RequestPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  // Initialize connection and channel
  async connect() {
    try {
      console.log('Connecting to RabbitMQ...');
      this.connection = await amqp.connect(config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Assert header exchange
      await this.channel.assertExchange(
        config.rabbitmq.exchange.name,
        config.rabbitmq.exchange.type,
        config.rabbitmq.exchange.options
      );

      console.log(`Header exchange '${config.rabbitmq.exchange.name}' is ready\n`);
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  // Publish request with headers
  async publishRequest(requestType) {
    const requestTemplate = headerConfig.requestTypes[requestType];
    
    if (!requestTemplate) {
      console.error(`Unknown request type: ${requestType}`);
      return;
    }

    const message = {
      ...requestTemplate.content,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };

    try {
      this.channel.publish(
        config.rabbitmq.exchange.name,
        '', // Routing key is ignored in header exchange
        Buffer.from(JSON.stringify(message)),
        {
          headers: requestTemplate.headers,
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now()
        }
      );

      console.log(`\nPublished ${requestType}:`);
      console.log('Headers:', JSON.stringify(requestTemplate.headers, null, 2));
      console.log('Content:', JSON.stringify(message, null, 2));
      console.log('---');
    } catch (error) {
      console.error('Error publishing request:', error);
    }
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Simulate various CDN requests
  async startSimulation() {
    console.log('\nStarting CDN Request Simulation...\n');

    const requestTypes = Object.keys(headerConfig.requestTypes);
    
    setInterval(() => {
      // Randomly select a request type
      const randomType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
      this.publishRequest(randomType);
    }, 3000); // Every 3 seconds
  }

  // Cleanup
  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log('\nPublisher stopped');
  }
}

// Run the publisher
async function main() {
  const publisher = new RequestPublisher();
  
  try {
    await publisher.connect();
    await publisher.startSimulation();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await publisher.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
