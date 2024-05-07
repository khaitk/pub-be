const amqp = require("amqplib");
const mongoose = require("mongoose");
const Order = require("./models/order.entity");

mongoose.connect("", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Order-Service Connected to MongoDB"))
  .catch((e) => console.log(e));

  async function connectToRabbitMQ() {
    const amqpServer = "amqp://localhost";
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("order-service-queue");
  }

connectToRabbitMQ().then(() => {
  channel.consume("order-service-queue", (data) => {
    // order service queue listens to this queue
    console.log("Consumed from order-service-queue");
    const { products } = JSON.parse(data.content);
    const newOrder = createOrder(products);
    channel.ack(data);
    channel.sendToQueue(
      "product-service-queue",
      Buffer.from(JSON.stringify(newOrder))
    );
  });
});

createOrder = (products) => {
  let total = 0;
  products.forEach((product) => {
    total += product.price;
  });

  const order = new Order({
    products,
    total,
  });
  order.save();
  return order;
};