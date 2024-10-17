import { Router } from "express";
import {
  changeRole,
  createClub,
  deleteClub,
  getAllClubs,
  getClubAchievements,
  getClubEvent,
  getClubMember,
  getOneClub,
  removeMember,
  superAccess,
  updateClub,loginAdmin
} from "../controller/club.controller.js";
import verifyClubAuth from "../middleware/club.auth.middleware.js";
import verifyClubUserAuth from "../middleware/club.user.auth.middleware.js";
import queryMiddleware from "../middleware/query.middleware.js";
import queryAdminMiddleware from "../middleware/querry.admin.middleware.js";

const router = Router();

// create club - very very secure
router.route("/admin/create/vs").post(createClub);

// authentication middleware - for admin

router.route("/admin/login/vs").post(loginAdmin);
// update club details
router.route("/admin/update").put(verifyClubAuth, updateClub);

// delete club
router.route("/admin/delete").delete(verifyClubAuth, deleteClub);

// all club members details - fullName, email, regdNo, Role, gender
// id - club id
// paginate members
router
  .route("/get/admin/sac")
  .get(verifyClubAuth, queryAdminMiddleware("User"), superAccess);

// id - member id
router
  .route("/get/admin/r/:id")
  .get(verifyClubAuth, verifyClubUserAuth, changeRole);

// id - member id
router
  .route("/get/admin/rv/:id")
  .get(verifyClubAuth, verifyClubUserAuth, removeMember);

// Normal routes

// show all club - clubName, clubImage, clubId, 
router.route("/getAll/:type").get(getAllClubs);

// show one club - clubName, clubImage, clubId, clubDescription, faculties, domain leads
router.route("/get/intro/:id").get(getOneClub);

// paginate events
router
  .route("/get/event/:id")
  .get(queryMiddleware("Event", "clubId"), getClubEvent);

// paginate members
router
  .route("/get/members/:id")
  .get(queryMiddleware("Club", "members"), getClubMember);

// paginate achievements
router
  .route("/get/achievements/:id")
  .get(queryMiddleware("Achievement", "clubId"), getClubAchievements);

export default router;
