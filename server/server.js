import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";
const app = express();
const port = process.env.PORT || 4000;
connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  //origin: "http://localhost:5173", // Replace with your frontend's URL (e.g., Vite/React port)
  credentials: true 
}));

app.get('/',(req,res)=>{
    res.send("API Working on port 4000")
})

app.use('/api/auth',authRouter);
app.use('/api/user',userRouter);


app.listen(port, () => {
  console.log(`Server started on PORT ${port}`);
});