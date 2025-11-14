// RabbitMQ connection configuration
module.exports = {
  rabbitmq: {
    url: 'amqp://localhost',
    exchange: {
      name: 'cdn.requests',
      type: 'headers',
      options: {
        durable: true
      }
    }
  }
};