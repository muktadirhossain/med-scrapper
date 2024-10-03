import mongoose from "mongoose";

const config = {
  isConnected: 0,
};

const connectDB = async () => {
  // Check if already connected to DB::
  if (config.isConnected) {
    return;
  }

  const options = {
    dbName: "med-scrapper",
  };
  try {
    const { connection } = await mongoose.connect(`mongodb://127.0.0.1:27017/rms`, options);

    config.isConnected = connection.readyState;

    console.log("-> Connected to DB 👍");
    console.log("-> connected with Host :", connection.host);
    console.log("->           host_name :", connection.name);
  } catch (error) {
    // console.log("Failed to connect DB::", error);
  }
};

export default connectDB;
