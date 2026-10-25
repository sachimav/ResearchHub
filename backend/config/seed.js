import bcrypt from "bcryptjs";
import Department from "../models/department.js";
import Batch from "../models/batch.js";
import User from "../models/user.js";
import Supervisor from "../models/supervisor.js";
import Student from "../models/Student.js";
import Research from "../models/research.js";
import Deadline from "../models/deadline.js";

export const seedDatabase = async () => {
  try {
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      console.log("Seeding default departments and batches...");
      const departments = await Department.insertMany([
        {
          name: "Department of Information and Communication Technology",
          description: "Focusing on software engineering, AI, distributed systems, and network security.",
        },
        {
          name: "Department of Physical Science",
          description: "Applied mathematics, computing, and electronic instrumentation.",
        },
        {
          name: "Department of Bio Science",
          description: "Biotechnology, microbiology, and environmental conservation.",
        },
        {
          name: "Department of Business Studies",
          description: "Business analytics, digital finance, and enterprise systems.",
        },
      ]);

      const batches = await Batch.insertMany([
        {
          batchName: "2020/2021",
          academicYear: "2020/2021",
          description: "Final Year Academic Batch",
        },
        {
          batchName: "2021/2022",
          academicYear: "2021/2022",
          description: "Undergraduate Research Cohort 2021/2022",
        },
        {
          batchName: "2022/2023",
          academicYear: "2022/2023",
          description: "Undergraduate Research Cohort 2022/2023",
        },
      ]);

      // Seed a default academic supervisor if none exists
      const supervisorUser = await User.findOne({ email: "dr.perera@vau.ac.lk" });
      if (!supervisorUser) {
        const hashedPassword = await bcrypt.hash("Supervisor@123", 10);
        const user = await User.create({
          name: "Dr. K. Perera",
          email: "dr.perera@vau.ac.lk",
          password: hashedPassword,
          role: "supervisor",
          designation: "Senior Lecturer (Grade I)",
          institution: "University of Vavuniya",
          phone: "+94 77 123 4567",
        });

        const supervisor = await Supervisor.create({
          userId: user._id,
          departmentId: departments[0]._id,
          designation: "Senior Lecturer (Grade I)",
          expertise: ["Machine Learning", "Cloud Systems", "Bioinformatics", "Cybersecurity"],
          availability: [
            { day: "Monday", startTime: "09:00", endTime: "12:00" },
            { day: "Wednesday", startTime: "14:00", endTime: "16:30" },
            { day: "Friday", startTime: "10:00", endTime: "13:00" },
          ],
        });

        // Add a demo student
        const studentHashedPass = await bcrypt.hash("Student@123", 10);
        const stuUser = await User.create({
          name: "A. S. Silva",
          email: "2020ict042@stu.vau.ac.lk",
          password: studentHashedPass,
          role: "student",
          phone: "+94 71 987 6543",
        });

        const student = await Student.create({
          userId: stuUser._id,
          regNo: "2020/ICT/042",
          departmentId: departments[0]._id,
          batchId: batches[1]._id,
          program: "BSc (Hons) in Information & Technology",
        });

        // Seed demo research project
        await Research.create({
          studentId: student._id,
          supervisorId: supervisor._id,
          batchId: batches[1]._id,
          title: "AI-Powered Early Detection of Agricultural Crop Diseases in the Northern Province",
          description: "Development of a lightweight deep learning computer vision model deployable on mobile devices to diagnose foliar plant diseases in rural farming communities.",
          topic: "Artificial Intelligence & Agricultural Tech",
          academicYear: "2021/2022",
          status: "ongoing",
          progressPercentage: 65,
          isPublic: true,
          milestones: [
            {
              title: "Research Proposal & Problem Formulation",
              description: "Complete formal literature review and proposal defense.",
              status: "completed",
              dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              completedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
            },
            {
              title: "Dataset Collection & Preprocessing",
              description: "Collect and annotate 2,500 field leaf images.",
              status: "completed",
              dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            },
            {
              title: "Model Architecture & Training",
              description: "Train lightweight MobileNetV3 and YOLOv8 models.",
              status: "in_progress",
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            },
            {
              title: "System Integration & Field Evaluation",
              description: "Deploy offline inference app and collect farmer usability feedback.",
              status: "pending",
              dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            },
            {
              title: "Final Thesis Dissertation & Defense",
              description: "Comprehensive final report submission and oral defense.",
              status: "pending",
              dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
            },
          ],
        });

        // Seed academic deadlines
        await Deadline.insertMany([
          {
            batchId: batches[1]._id,
            title: "Interim Progress Report Submission",
            description: "Submit mid-term progress document including experimental results.",
            deadlineType: "progress_report",
            dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
          },
          {
            batchId: batches[1]._id,
            title: "Draft Thesis Dissertation Upload",
            description: "Submit initial dissertation for similarity analysis and supervisor review.",
            deadlineType: "final_report",
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          {
            batchId: batches[1]._id,
            title: "Final Research Oral Presentation & Defense",
            description: "Final viva voce evaluation before the departmental research panel.",
            deadlineType: "presentation",
            dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          },
        ]);

        console.log("Default seed data created successfully (Demo supervisor: dr.perera@vau.ac.lk / Supervisor@123, Student: 2020ict042@stu.vau.ac.lk / Student@123)");
      }
    }
  } catch (err) {
    console.error("Database seed error:", err.message);
    throw err;
  }
};
