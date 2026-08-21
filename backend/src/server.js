import app from "./app.js";
import dotenv from "dotenv";
dotenv.config();
import connectToDB from "./db/db.js";

const PORT = process.env.PORT || 6000;
connectToDB();

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
