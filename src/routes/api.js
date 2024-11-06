import { Router } from "express";
import GeneralController from "../controllers/generalController.js";
import CandidateController from "../controllers/candidateController.js";
import RecruiterController from "../controllers/recruiterController.js";
import authMiddleware from "../middleware/Authenticate.js";

const router = Router();

router.get('/health', GeneralController.healthCheck);

// candidates related routes
router.post("/candidates/register", CandidateController.register);
router.post("/candidates/login", CandidateController.login);
router.get("/candidates/jobs", CandidateController.getAllJobs);
router.post("/candidates/jobs/apply", authMiddleware, CandidateController.applyJob);
router.get("/candidates/applications", authMiddleware,CandidateController.appliedJobs);



// recruiter related routes
router.post("/recruiters/register", RecruiterController.register);
router.post("/recruiters/login", RecruiterController.login);
router.post("/recruiters/jobs/post", authMiddleware,RecruiterController.jobPost);
router.get("/recruiters/jobs/applications", RecruiterController.appliedApplicants);




export default router;