import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import transporter from "../config/nodemailer.js";

export const register = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({
            success: false,
            message: "Missing Details"
        })
    }

    try {

        const exsistingUser = await userModel.findOne({ email });

        if (exsistingUser) {
            res.status(409).json({
                success: false,
                message: "Registration Falid. A user with this email alrady exists"
            })
        }

        const hashedpassword = await bcrypt.hash(password, 10);

        const user = new userModel({ name, email, password: hashedpassword });

        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        //ending welcome email to new user

        const mailOption = {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:"Welcome to AtomixLab",
            text:`Welcome to AtomixLab, Your account has been created with email id: ${email}`
        }

        await transporter.sendMail(mailOption);

        return res.status(200).json({
            success: true,
            message: "User registered sucessfully"

        })



    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and Password are required"
        })
    }

    try {

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "user login successfuly"
        })



    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const logout = async (req,res) => {
    try {

        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.status(200).json(
            {
                success:true,
                message:"User logout Successfully"
            }
        )


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// send verification email to the users email
export const sendVerifyOtp = async (req,res)=>{
    try {
        const {userId} = req.body;

        const user =  await userModel.findById(userId);

        if(user.isAccountVerified){
            return res.json({
                success:false,
                message:"Account Already verified"
            })
        }

        const otp = Sring(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();
        
        const mailOption = {
            from:process.env.SENDER_EMAIL,
            to:email,
            subject:"Account Verification OTP",
            text:`Your OTP is ${otp} , Verify your Account using this OTP`
        }

        await transporter.sendMail(mailOption);

        return res.status(200).json({
            success:true,
            message:"Verification OTP Sent on Email"
        });

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

const verifyEmail = async (req,res)=>{
    const {userId, otp} = req.body;
    
    if(!userId || !otp){
        return res.status(400).json({success:true,message:"Missing Details"})
    }

    try {
        const user = await userModel.findById(userId);
        if(!user){
            return res.status(400).json(
                {
                    success:false,
                    message:'User not found'
                }
            )
        }

        if(user.verifyOtp === '' || user.verifyOtp !== otp){
            return res.status(400).json({
                success:false,
                message:"Invalid OTP"
            })
        }

        if(user.verifyOtpExpireAt < Date.now()){
            return res.status(400).json({
                success:false,
                message:'OTP Expired'
            })
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.status(200).json({
            success:true,
            message:"Email Verified successfully"
        })

    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}