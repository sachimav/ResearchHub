import mongoose from "mongoose";

import Student from "../models/Student.js";
import Research from "../models/research.js"

const getStudent = (userId) => Student.findOne({userId})
    .populate("userId", "name email role")
    .populate("departmentId", "name")
    .populate("batchId", "batchName academicYear");

const getOwnedR = (researchId, studentId) =>{
    if(!mongoose.isValidObjectId(researchId)){
        return null;
    }
    return Research.findOne({_id: researchId, studentId});
};    

export const getProfile = async(req,res) => {
    try{
        const student = await getStudent(req.user.id);
        if(!student){
            return res.status(404).json({Message:"Student profile not found"});
        }
        return res.status(200).json({student});
    }
    catch(error){
        return error;
    }
};