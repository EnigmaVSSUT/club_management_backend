import { Router } from "express";
import verifyClubAuth from "../middleware/club.auth.middleware.js";
import {
    createProject,
    updateProject,
    deleteProject,
    getUpComingProject,
    AllProjects
} from "../controller/projects.controller.js";

const router = Router();

// admin middleware

// create
router.route("/create").post(verifyClubAuth, createProject);
// update
router.route("/update/:id").put(verifyClubAuth, updateProject);
// delete
router.route("/delete/:id").delete(verifyClubAuth, deleteProject);

// trending achievements - only 3
router.route("/upcoming").get(getUpComingProject);
router.route("/getAllProjects").get(AllProjects);
export default router;