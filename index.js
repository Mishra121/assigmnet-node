import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes go here
import ApiRoutes from "./src/routes/api.js";
app.use("/api", ApiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

