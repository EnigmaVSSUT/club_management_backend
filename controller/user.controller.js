import { User } from "../model/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import emptyFieldValidation from "../helper/emptyFieldValidation.js";
import { Club } from "../model/club.model.js";
import sendEmailViaResend from "../helper/emailSend.js";
import cron from "node-cron";
import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
export const createUser = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      regdNo,
      email,
      password,
      fullName,
      gender,
      yearOfGraduation,
      domain,
      photo,
      skills,
      githubLink,
      linkedinLink,
    } = req.body;

    // Validate required fields
    emptyFieldValidation([regdNo, email, password, fullName]);

    const existingUser = await User.findOne({
      $or: [{ email }, { regdNo }],
    }).session(session);

    if (existingUser) {
      throw new apiError(409, "User already exists. please login");
    }

    // Create the user
    const user = await User.create(
      [
        {
          regdNo,
          email,
          password,
          fullName,
          gender,
          yearOfGraduation,
          domain,
          photo,
          skills,
          githubLink,
          linkedinLink,
        },
      ],
      { session }
    );

    // Send confirmation email
    await sendEmailViaResend([email], "Confirmation Email");

    // Schedule a job to delete the user after 1 days if conditions are met
    const deletionDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const cronTime = `${deletionDate.getUTCMinutes()} ${deletionDate.getUTCHours()} ${deletionDate.getUTCDate()} ${
      deletionDate.getUTCMonth() + 1
    } *`;

    cron.schedule(cronTime, async () => {
      const transactionSession = await mongoose.startSession();
      transactionSession.startTransaction();
      try {
        const userToCheck = await User.findById(user._id).session(
          transactionSession
        );
        if (!userToCheck.isAuthenticated) {
          await User.findByIdAndDelete(userToCheck._id).session(
            transactionSession
          );
          await transactionSession.commitTransaction();
          return res
            .status(201)
            .json(new apiResponse(201, user, "User deleted"));
        }
      } catch (error) {
        await transactionSession.abortTransaction();
        console.error(error);
        throw new apiError(500, "Error in deleting user.");
      } finally {
        await transactionSession.endSession();
      }
    });

    await session.commitTransaction();
    res
      .status(201)
      .json(
        new apiResponse(201, user, "User created successfully but not verified")
      );
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json({ message: "An error occurred." });
  } finally {
    session.endSession();
  }
});

export const clubJoinRequest = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { clubId } = req.body;
    const clubTrimmedId = clubId.trim();
    const club = await Club.findById(clubTrimmedId).session(session);
    if (!club) {
      throw new apiError(404, "Club not found.");
    }

    await sendEmailViaResend([club.serviceMail], "Club Joining Request");

    // Schedule a job to delete the user after 1 days if conditions are met
    const deletionDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    const cronTime = `${deletionDate.getUTCMinutes()} ${deletionDate.getUTCHours()} ${deletionDate.getUTCDate()} ${
      deletionDate.getUTCMonth() + 1
    } *`;

    cron.schedule(cronTime, async () => {
      const userToCheck = await User.findById(user._id);
      if (!userToCheck.isInClub) {
        await User.findByIdAndDelete(userToCheck._id);
        console.log(`User ${userToCheck._id} deleted due to inactivity.`);
      }
    });

    await session.commitTransaction();
    return res
      .status(200)
      .json(new apiResponse(200, null, "Request sent to corresponding club."));
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json(new apiResponse(500, null, "An error occurred."));
  } finally {
    await session.endSession();
  }
});

export const clubApprove = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const userTrimmedId = id.trim();
    const { clubId } = req.body;
    const clubTrimmedId = clubId.trim();

    const user = await User.findById(userTrimmedId).session(session);
    if (!user) {
      throw new apiError(404, "User not found.");
    }
    if (!user.isAuthenticated) {
      return res
        .status(200)
        .json(new apiResponse(200, user, "User is not verified."));
    }
    const club = await Club.findById(clubTrimmedId).session(session);
    if (!club) {
      throw new apiError(404, "Club not found.");
    }

    const updatedUser = await findByIdAndUpdate(
      user._id,
      {
        $push: { clubId: clubTrimmedId },
        isInClub: true,
      },
      { new: true }
    ).session(session);

    const updatedClub = await findByIdAndUpdate(
      club._id,
      {
        $push: { members: userTrimmedId },
      },
      { new: true }
    ).session(session);

    if (!updatedUser || !updatedClub) {
      throw new apiError(500, "An error occurred.");
    }
    await session.commitTransaction();
    return res
      .status(200)
      .json(
        new apiResponse(200, newUser, "User added in the club successfully.")
      );
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json(new apiResponse(500, null, "An error occurred."));
  } finally {
    await session.endSession();
  }
});

export const verifyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trimmedId = id.trim();
  const user = await User.findById(trimmedId);
  if (!user) {
    throw new apiError(404, "User not found.");
  }
  if (user.isAuthenticated) {
    return res
      .status(200)
      .json(new apiResponse(200, user, "User already verified"));
  }
  const newUser = await User.findByIdAndUpdate(
    user._id,
    { isAuthenticated: true },
    { new: true }
  );
  return res
    .status(200)
    .json(new apiResponse(200, newUser, "User verified successfully."));
});

export const updateUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updates = req.body;

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new apiError(404, "Error is updating the user");
  }
  res
    .status(200)
    .json(new apiResponse(200, updatedUser, "User updated successfully."));
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trimmedId = id.trim();
  const user = await User.findById(trimmedId);
  if (!user) {
    throw new apiError(404, "User not found.");
  }

  if (!user.isAuthenticated) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "User is not verified."));
  }

  res
    .status(200)
    .json(new apiResponse(200, user, "User retrieved successfully."));
});


export const createUserWithoutVerification = asyncHandler(async (req, res) => {
  // add logic here
})



export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    throw new apiError(400, "Email and password are required.");
  }

  console.log(email,password)
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User not found.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new apiError(401, "Invalid credentials.");
  }
  if (!user.isAuthenticated) {
    return res.status(401).json(new apiResponse(401, null, "User not verified."));
  }
  if (!user.isInClub) {
    return res.status(401).json(new apiResponse(401, null, "User is not present in any club."));
  }
  const token = jwt.sign(
    { _id: user._id, email: user.email },
    process.env. ACCESS_TOKEN_SECRET_USER    ,
    { expiresIn: "1d" }  
  );


  res.cookie("userT", token, { httpOnly: true, secure: true, maxAge: 24 * 60 * 60 * 1000 }); 


  return res.status(200).json(new apiResponse(200, { token }, "User logged in successfully."));
});

