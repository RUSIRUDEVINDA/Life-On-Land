import mongoose from "mongoose"

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not defined")
    process.exit(1)
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB connected: ${connection.connection.host}`)
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`)
    process.exit(1)
  }
}
