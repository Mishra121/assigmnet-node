import prisma from "../DB/db.config.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";



class CandidateController {
    static async healthCheck(req, res) {
        return res.json({
            status: 200,
            message: "health fine, running.",
        });
    }


    static async register(req, res) {
        try {
            const body = req.body;
            const payload = body;

            // console.log(body);

            //   * Check if email exist
            const findUser = await prisma.candidate.findUnique({
                where: {
                    email: payload.email,
                },
            })

            if (findUser) {
                return res.status(400).json({
                    errors: {
                        email: "Email already taken.please use another one.",
                    },
                });
            }

            //   * Encrypt the password
            const salt = bcrypt.genSaltSync(10);
            payload.password = bcrypt.hashSync(payload.password, salt);
            // payload.jobs = [];
            console.log(payload)

            const user = await prisma.candidate.create({
                data: payload,
            });

            delete user.password;

            return res.json({
                status: 200,
                message: "User created successfully",
                user,
            });
        } catch (error) {
            console.log("The error is", error);
            return res.status(500).json({
                status: 500,
                message: "Something went wrong.Please try again.",
            });
        }
    }

    static async login(req, res) {
        try {
            const body = req.body;
            const payload = body;
            //   * Find user with email
            const findUser = await prisma.candidate.findUnique({
                where: {
                    email: payload.email,
                },
            });

            if (findUser) {
                if (!bcrypt.compareSync(payload.password, findUser.password)) {
                    return res.status(400).json({
                        errors: {
                            email: "Invalid Credentials.",
                        },
                    });
                }

                // * Issue token to user
                const payloadData = {
                    id: findUser.id,
                    name: findUser.name,
                    email: findUser.email,
                };


                const token = jwt.sign(payloadData, process.env.JWT_SECRET, {
                    expiresIn: "365d",
                });

                return res.json({
                    message: "Logged in",
                    access_token: `Bearer ${token}`,
                });
            }

            return res.status(400).json({
                errors: {
                    email: "No user found with this email.",
                },
            });
        } catch (error) {
            console.log("The error is", error);
            return res.status(500).json({
                status: 500,
                message: "Something went wrong.Please try again.",
            });
        }
    }

    static async getAllJobs(req, res) {
        try {

            const jobs = await prisma.job.findMany({
                select: {
                    id: true,
                    title: true,
                    description: true,
                    recruiter: {
                        select: {
                            email: true,
                        },
                    },
                },
            });

            res.status(200).json({
                message: "Jobs fetched successfully",
                jobs,
            });
        } catch (error) {
            console.error("Error fetching jobs:", error);
            res.status(500).json({ message: "Failed to fetch jobs" });
        }
    }

    static async applyJob(req, res) {
        try {
            const candidateId = req.user.id;
            const { jobId } = req.body;

            // Validate input
            if (!jobId) {
                return res.status(400).json({ message: "Job ID is required" });
            }

            // Check if the job exists
            const job = await prisma.job.findUnique({
                where: { id: jobId },
            });

            if (!job) {
                return res.status(404).json({ message: "Job not found" });
            }

            // Check if the candidate has already applied to this job
            const existingApplication = await prisma.application.findFirst({
                where: {
                    candidateId: candidateId,
                    jobId: jobId,
                },
            });

            if (existingApplication) {
                return res.status(409).json({ message: "You have already applied to this job" });
            }

            // Create a new application
            const application = await prisma.application.create({
                data: {
                    candidateId,
                    jobId,
                },
            });

            // TODO: trigger an email notification to the candidate and recruiter here

            res.status(201).json({
                message: "Application submitted successfully",
                application,
            });
        } catch (error) {
            console.error("Error applying to job:", error);
            res.status(500).json({ message: "Failed to apply to job" });
        }
    }

    static async appliedJobs(req, res) {
        try {
            const candidateId = req.user.id;

            // Fetch all applications for the candidate, including job details
            const applications = await prisma.application.findMany({
                where: {
                    candidateId: candidateId,
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                        },
                    },
                },
            });

            res.status(200).json({
                message: "Applications fetched successfully",
                applications,
            });
        } catch (error) {
            console.error("Error fetching applications:", error);
            res.status(500).json({ message: "Failed to fetch applications" });
        }
    }
}

export default CandidateController;