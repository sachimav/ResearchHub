import mongoose from "mongoose";

import Research from "../models/research.js";
import Document from "../models/document.js";

const publicStatuses = ["approved", "ongoing", "completed"];

const researchPopulation = [
  {
    path: "studentId",
    select: "userId departmentId batchId",
    populate: [
      { path: "userId", select: "name" },
      { path: "departmentId", select: "name" },
      { path: "batchId", select: "batchName academicYear" },
    ],
  },
  {
    path: "supervisorId",
    select: "userId designation",
    populate: { path: "userId", select: "name designation" },
  },
];

const getPublicResearch = (researchId) => {
  if (!mongoose.isValidObjectId(researchId)) {
    return null;
  }
  return Research.findOne({
    _id: researchId,
    isPublic: true,
    status: { $in: publicStatuses },
  }).select("title description topic academicYear status progressPercentage studentId supervisorId updatedAt")
    .populate(researchPopulation);
};

export const listResearch = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 12);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (page - 1) * limit > 1000000) {
      return res.status(400).json({ message: "page must be a positive integer and limit must be between 1 and 100." });
    }
    const filter = {
      isPublic: true,
      status: { $in: publicStatuses },
    };

    if (req.query.status !== undefined) {
      const allowedFilterStatuses = ["ongoing", "completed"];
      if (typeof req.query.status !== "string" || !allowedFilterStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: `status must be one of: ${allowedFilterStatuses.join(", ")}.`,
        });
      }
      if (req.query.status === "ongoing") {
        filter.status = { $in: ["ongoing", "approved"] };
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.q !== undefined) {
      if (typeof req.query.q !== "string") {
        return res.status(400).json({ message: "q must be a string." });
      }
      const search = req.query.q.trim();
      if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(escapedSearch, "i");
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { topic: searchRegex },
          { academicYear: searchRegex },
        ];
      }
    }

    if (req.query.academicYear !== undefined) {
      if (typeof req.query.academicYear !== "string" || !req.query.academicYear.trim()) {
        return res.status(400).json({ message: "academicYear must be a non-empty string." });
      }
      filter.academicYear = req.query.academicYear.trim();
    }

    const [research, total] = await Promise.all([Research.find(filter)
      .select("title description topic academicYear status progressPercentage studentId supervisorId updatedAt")
      .populate(researchPopulation)
      .sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
      Research.countDocuments(filter),
    ]);

    return res.json({ research, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
};

export const getResearchDetails = async (req, res, next) => {
  try {
    const research = await getPublicResearch(req.params.researchId);
    if (!research) {
      return res.status(404).json({ message: "Research project not found." });
    }

    const documents = await Document.find({
      researchId: research._id,
      visibility: "public",
      status: "approved",
    }).select("title fileUrl documentType createdAt").sort({ createdAt: -1 });

    return res.json({ research, documents });
  } catch (error) {
    return next(error);
  }
};
