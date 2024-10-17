import { Router } from "express";
import {
  createUser,
  updateUser,
  getUserById,
  clubApprove,
  verifyUser,
  clubJoinRequest,
  createUserWithoutVerification,
  loginUser
} from "../controller/user.controller.js";
import verifyUserAuth from "../middleware/user.auth.middleware.js";

const router = Router();

// create user
router.route("/create").post(createUser);

// club join request
router.route("/join").post(verifyUserAuth, clubJoinRequest);

// verify user
router.route("/verify/:id").post(verifyUser);

// club approve
router.route("/apv/:id").put(clubApprove);

// show single user
router.route("/get/:id").get(getUserById);

// create user without verification
router.route("/create/sc").post(createUserWithoutVerification);

// update user
router.route("/update").put(verifyUserAuth, updateUser);

// login user
router.route("/login").post(loginUser);

export default router;
