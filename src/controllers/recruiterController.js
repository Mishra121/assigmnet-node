import prisma from "../DB/db.config.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";


class RecruiterController {
    static async healthCheck(req, res) {
        return res.json({
            status: 200,
            message: "health fine, running.",
        });
    }

    static async register(req, res) {
        try {
            const body = req.body;
            //   const validator = vine.compile(registerSchema);
            //   const payload = await validator.validate(body);
            const payload = body;

            // console.log(body);

            //   * Check if email exist
            const findUser = await prisma.recruiter.findUnique({
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

            const user = await prisma.recruiter.create({
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
            //   const validator = vine.compile(loginSchema);
            //   const payload = await validator.validate(body);

            //   * Find user with email
            const findUser = await prisma.recruiter.findUnique({
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

    static async jobPost(req, res) {
        try {
            const recruiterId = req.user.id;
            const { title, description } = req.body;

            // Validate input
            if (!title || !description) {
                return res.status(400).json({ message: "Title and description are required" });
            }

            // Create a new job posting

            console.log({ title, description, recruiterId });
            const job = await prisma.job.create({
                data: {
                    title,
                    description,
                    recruiterId,
                },
            });

            res.status(201).json({
                message: "Job posted successfully",
                job,
            });
        } catch (error) {
            console.error("Error posting job:", error);
            res.status(500).json({ message: "Failed to post job" });
        }
    }

    static async appliedApplicants(req, res) {
        try {
            // const recruiterId = req.user.id; 
            const { jobIdQuery } = req.query;

            const jobId = Number(jobIdQuery);

            if (!jobId) {
                return res.status(400).json({ message: "Job ID is required" });
            }

            const job = await prisma.job.findFirst({
                where: {
                    id: jobId,
                    // recruiterId: recruiterId,
                },
            });

            if (!job) {
                return res.status(404).json({ message: "Job not found" });
            }

            // Fetch all applicants for the job
            const applicants = await prisma.application.findMany({
                where: {
                    jobId: jobId,
                },
                include: {
                    candidate: {
                        select: {
                            id: true,
                            email: true, // Optional: Include candidate details
                        },
                    },
                },
            });

            res.status(200).json({
                message: "Applicants fetched successfully",
                applicants,
            });
        } catch (error) {
            console.error("Error fetching applicants:", error);
            res.status(500).json({ message: "Failed to fetch applicants" });
        }
    }


    static async logout(req, res) {
        try {

            // if token stored in read only cookie otherwise need to remove from localstorage from client
            res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

            res.status(200).json({
                message: 'Logged out successfully',
            });
        } catch (error) {
            console.error("Error logging out:", error);
            res.status(500).json({ message: "Failed to log out" });
        }
    }
}

export default RecruiterController;