require("dotenv").config();
const app = require("./app");
const { connectDb } = require("./config/db");

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
