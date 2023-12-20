import express from "express";
import { init } from "./db/connection";
import router from "./routes/routes";
import "dotenv/config";
import cors from "cors";


const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: "*",
    credentials:true,
    optionsSuccessStatus: 200
}));

app.get("/", (_req, res) => {
    res.send("Foodres API");
});

app.use(express.json());

// Use the routes
app.use("/api/v1", router);

const run = async () =>{
    init();
    app.listen(port, () => {
        console.log(`Server running on port http://localhost:${port}`);
    });
    
};

run();