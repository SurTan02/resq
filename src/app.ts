import express from "express";
import { init, migration } from "./db/connection";
import router from "./routes/routes";
import "dotenv/config";

const app = express();
const port = process.env.PORT;


app.use(express.json());

// Use the routes
app.use("/api/v1", router);

const run = async () =>{
    init();
    await migration();
    app.listen(port, () => {
        console.log(`Server running on port http://localhost:${port}`);
    });
    
};

run();