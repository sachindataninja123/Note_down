import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URL);

    console.log(
      `MONGODB CONNECTED!! Host: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MONGODB CONNECTION ERROR: ", error);
  }
};

export default connectToDB;
