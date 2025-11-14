const amqp = require('amqplib');
const config = require('./config');
const headerConfig = require('./header-config');

class RegionalRouter {
  constructor(region) {
    this.region = region;
    this.connection = null;
    this.channel = null;
    
    // Get configuration for specified region
    const regionKey = `${region}Region`;
    const regionConfig = headerConfig[regionKey];
    
    if (!regionConfig) {
      throw new Error(`Invalid region: ${region}. Use: us, eu, or asia`);
    }
    
    this.queueName = regionConfig.queueName;
    this.bindingArgs = regionConfig.bindingArgs;
  }

  async connect() {
    try {
      console.log(`Regional Router [${this.region.toUpperCase()}] starting...`);
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

      // Note: Using x-match: 'any' for regional routing
      await this.channel.bindQueue(
        this.queueName,
        config.rabbitmq.exchange.name,
        '',
        this.bindingArgs
      );

      console.log(`Queue '${this.queueName}' bound with headers:`, this.bindingArgs);
      console.log(`Routing requests for ${this.region.toUpperCase()} region...\n`);
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

          await this.routeRequest(content, headers);
          
          this.channel.ack(msg);
        }
      },
      { noAck: false }
    );
  }

  async routeRequest(content, headers) {
    console.log(`\nREGIONAL ROUTER [${this.region.toUpperCase()}]:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Request ID:', content.requestId);
    console.log('Region:', headers['region']);
    console.log('Content Type:', headers['content-type']);
    
    // Get nearest edge server
    const edgeServer = this.getNearestEdgeServer();
    
    console.log('\nRegional Routing:');
    console.log(`  Target Region: ${this.region.toUpperCase()}`);
    console.log(`   Edge Server: ${edgeServer}`);
    console.log(`  Latency: ${this.getLatency()}ms`);
    console.log(`  Load Balancing: Active`);
    
    await this.sleep(150);
    
    console.log(`\nRequest routed to ${this.region.toUpperCase()} edge server!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  getNearestEdgeServer() {
    const servers = {
      us: ['us-east-1.cdn.example.com', 'us-west-1.cdn.example.com'],
      eu: ['eu-west-1.cdn.example.com', 'eu-central-1.cdn.example.com'],
      asia: ['ap-southeast-1.cdn.example.com', 'ap-northeast-1.cdn.example.com']
    };
    
    const regionServers = servers[this.region] || servers.us;
    return regionServers[Math.floor(Math.random() * regionServers.length)];
  }

  getLatency() {
    // Simulate latency based on region
    const latencies = { us: 15, eu: 25, asia: 35 };
    return latencies[this.region] + Math.floor(Math.random() * 10);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
    console.log(`\nRegional Router [${this.region.toUpperCase()}] stopped`);
  }
}

// Get region from command line
const region = process.argv[2] || 'us';

async function main() {
  if (!['us', 'eu', 'asia'].includes(region)) {
    console.error('Invalid region. Use: us, eu, or asia');
    console.error('Example: node regional-router.js us');
    process.exit(1);
  }

  const router = new RegionalRouter(region);
  
  try {
    await router.connect();
    await router.consume();

    process.on('SIGINT', async () => {
      await router.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
