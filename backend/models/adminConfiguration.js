import mongoose from "mongoose";

const options = { timestamps: true, optimisticConcurrency: true };
const active = { type: Boolean, default: true };
const name = { type: String, required: true, trim: true, maxlength: 200 };

const programSchema = new mongoose.Schema({
  name, departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "departments", required: true },
  description: { type: String, default: "", maxlength: 2000 }, isActive: active,
}, options);
programSchema.index({ departmentId: 1, name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const yearSchema = new mongoose.Schema({
  name, startDate: { type: Date, required: true }, endDate: { type: Date, required: true }, isActive: active,
}, options);
yearSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const templateSchema = new mongoose.Schema({
  name, departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "departments", default: null },
  isActive: active,
  milestones: [{ title: name, description: { type: String, default: "", maxlength: 2000 }, offsetDays: { type: Number, min: 0, max: 3650, default: 0 } }],
  requiredDocuments: [{ documentType: { type: String, enum: ["proposal", "report", "progress_report", "final_report", "other"], required: true }, stage: { type: String, enum: ["proposal", "progress", "completion"], required: true } }],
}, options);
templateSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: "system" },
  universityName: { type: String, default: "University of Vavuniya", maxlength: 200 },
  contactEmail: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  currentAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: "academicYears", default: null },
  defaultMilestoneTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: "milestoneTemplates", default: null },
}, options);

export const DegreeProgram = mongoose.model("degreePrograms", programSchema);
export const AcademicYear = mongoose.model("academicYears", yearSchema);
export const MilestoneTemplate = mongoose.model("milestoneTemplates", templateSchema);
export const SystemSettings = mongoose.model("systemSettings", settingsSchema);
