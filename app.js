// const express = require("express");
// const app = express();

// const port = 5500;

// const data = [
//     { id: 1, name: "vetha", address: "karaikudi" },
//     { id: 2, name: "reena", address: "trichy" },
//     { id: 3, name: "anu", address: "coimbatore" }
// ];

// app.get('/student/details', (req, res) => {
//     res.json(data);
// });

// app.listen(port, () => {
//     console.log(`server is running on http://localhost:${port}`); 
// });

// app.get("/api/singledata",(req,res)=>{
//     const{id,name}=req.query;

// if(id,name)
// {
//     const result=data.find(item => item.id===Number(id) && item.name===String(name));
//     if(result)
//     {
//         res.json(result);
//     }
//     else{
//         res.status(400).json({error:"Data not found for the given name"})
//     }
// }
// else{
//     res.json(data);
// }
// });

const cors=require("cors");
const express = require("express");
const req = require("express/lib/request");
const mongoose = require("mongoose");
const app = express();
const jwt=require("jsonwebtoken");
const bcrypt=require("bcrypt");
const port = 5500;
app.use(cors());

const mongoUrl = "mongodb+srv://vetha:vetha@cluster0.4tigb.mongodb.net/ExpenseTracker"; 

mongoose.connect(mongoUrl)
.then(() => {
    console.log("Database connected successfully");
    app.listen(port, () => {
        console.log(`Server is running at port ${port}`);
    });
})
.catch((err) => console.log(err));

const expenseSchema=new mongoose.Schema({
    id:{type:String,required:true,unique:true},
    title:{type:String,required:true},
    amount:{type:Number,required:true}
});

const expenseModel=mongoose.model("expense-tracker",expenseSchema)

 //get
app.get("/api/expenses",async(req,res)=>{
    try
    {
       const expenses=await expenseModel.find();
       res.status(200).json(expenses);
    }
    catch(error)
    {
        res.status(500).json({message:"Failed to fetch expenses"});
    }
});

app.get('/api/expenses/:id',async(req,res)=>{
    try{
    const {id}=req.params;
    const expense=await expenseModel.findOne({id})
    if(!expense)
    {
        return res.status(404).json({message: "Expense not found"});
    }
    res.status(200).json(expense);
}
catch(error){
    res.status(500).json({message:"Error in fetch expenses"})
}
}) 

//post

app.use(express.json());

const { v4: uuidv4 } = require("uuid");

app.post("/api/expenses", async (req, res) => {
    try {
        const data = req.body; 

        const newExpense = new expenseModel({
            id: uuidv4(),
            title: data.title,
            amount: data.amount,
        });

        const savedExpense = await newExpense.save();
        res.status(200).json(savedExpense);
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: "Error saving expense", error: error.message });
    }
});

//put-update

app.put("/api/expenses/:id",async(req,res)=>{
    const{id}=req.params;
    const {title,amount}=req.body;
    console.log({title})
    try{
        const updateExpense=await expenseModel.findOneAndUpdate(
            {id},
            {title,amount}
        );
        if(!updateExpense)
        {
            return res.status(404).json({message:"Expense not found"});
        }
        res.status(200).json({title,amount})
    }
    catch(error){
        res.sendStatus(500).json({message:"Error in updating the message"});
    }
});

//delete
app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedExpense = await expenseModel.findOneAndDelete({ id });

        if (!deletedExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json({ message: "Expense deleted successfully", deletedExpense });
    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: "Error deleting expense", error: error.message });
    }
});

const userSchema=new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true}
});
const user=mongoose.model("user",userSchema);

app.post("/api/register",async(req,res)=>{
    const {username,password}=req.body;
    const hashedPassword=await bcrypt.hash(password,10);
    const newUser=new user({
        username,
        password:hashedPassword
    });
    const savedUser=await newUser.save();
    res.status(200).json({message:"User registered successfully",user:savedUser});
});

app.post("/api/login",async(req,res)=>{
    const {username,password}=req.body;
    const userData=await user.findOne({username});
    
    const isValidPassword=await bcrypt.compare(password,userData.password);
    if(!isValidPassword)
    {
        return res.status(400).json({message:"Invalid credentials"});
    }

    const token=jwt.sign({username:userData.username},"my-key",{expiresIn:"1h"});
    res.status(200).json({message:"Login successful",token});
});

const authorize=(req,res,next)=>{
    const token=req.headers["authorization"]?.split(" ")[1];
    console.log({token});
    if(!token)
    {
        return res.status(401).json({message:"No token provided"});
    }
    jwt.verify(token,"my-key",(error,userInfo)=>{
        if(error)
        {
            return res.status(401).json({message:"Unauthorized"});
        }
        req.user=userInfo;
        next();
    });
}

app.get("/api/secured",authorize,(req,res)=>{
    res.json({message:"Access granted",user:req.user});
});

