import app from "index";
import dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Test server running on port 5000"));

