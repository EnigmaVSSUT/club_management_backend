import { Club } from "../model/club.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken"
import emptyFieldValidation from "../helper/emptyFieldValidation.js";
import bcrypt from "bcrypt"
// POST
export const createClub = asyncHandler(async (req, res) => {
  const {
    clubName,
    achievements,
    clubDescription,
    clubLogo,
    facultyAdvisor,
    coordinator,
    assistantCoordinator,
    members,
    password, 
    serviceMail
  } = req.body;
  console.log(req.body); 

  // Empty field Validation
  emptyFieldValidation([
    clubName,
    achievements,
    facultyAdvisor,
    coordinator,
    assistantCoordinator,
    clubDescription,
    clubLogo,
    members,
    password, 
    serviceMail
  ]);
  const club = new Club({
    clubName,
    achievements,
    facultyAdvisor,
    coordinator, // name
    assistantCoordinator, // name
    members,
    password, 
    serviceMail ,
    clubDescription,  
    clubLogo,
  });
  await club.save();
  return res
    .status(201)
    .json(new apiResponse(201, club, "Club created successfully."));
});

// GET
export const getAllClubs = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const clubs = await Club.find({ type: type.trim() });
  res
    .status(200)
    .json(new apiResponse(200, clubs, "Clubs retrieved successfully."));
});

// GET
export const getOneClub = asyncHandler(async (req, res) => {
  const { id } = req.params; // club id
  const trimmedId = id.trim();
  const club = await Club.findById(trimmedId);
  if (!club) {
    throw new apiError(404, "Club not found.");
  }
  res.status(200).json(
    new apiResponse(
      200,
      {
        clubName: club.clubName,
        clubLogo: club.clubLogo,
        clubId: club._id,
        clubDescription: club.clubDescription,
      },
      "Club retrieved successfully."
    )
  );
});

// GET
export const getClubEvent = asyncHandler(async (req, res) => {
  const { count, offset, limit, data } = req.paginate;

  if (data.length === 0) {
    throw new apiError(404, "There is no event in this club.");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { count, offset, limit, data },
        "Club Event retrieved successfully."
      )
    );
});

// GET
export const getClubMember = asyncHandler(async (req, res) => {
  const { id } = req.params; // club id
  const trimmedId = id.trim();
  const club = await Club.findById(trimmedId).populate("members");
  if (!club) {
    throw new apiError(404, "Club not found.");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, club.members, "Club Member retrieved successfully.")
    );
});

// GET
export const getClubAchievements = asyncHandler(async (req, res) => {
  const { count, limit, offset, data } = req.paginate;
  if (data.length === 0) {
    throw new apiError(404, [], "There is no achievement in this club.");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { count, offset, limit, data },
        "Club Achievements retrieved successfully."
      )
    );
});

// PUT
export const updateClub = asyncHandler(async (req, res) => {
  const updates = req.body;

  const targetedClub = req.club;
  const clubId = targetedClub._id;

  const updatedClub = await Club.findByIdAndUpdate(clubId, updates, {
    new: true,
    runValidators: true,
  });
  if (!updatedClub) {
    throw new apiError(404, "Error is club updation");
  }
  res
    .status(200)
    .json(new apiResponse(200, updatedClub, "Club updated successfully."));
});

// DELETE
export const deleteClub = asyncHandler(async (req, res) => {
  const targetedClub = req.club;
  const clubId = targetedClub._id;
  const deletedClub = await Club.findByIdAndDelete(clubId);
  if (!deletedClub) {
    throw new apiError(404, "Error is club deletion.");
  }
  res
    .status(200)
    .json(new apiResponse(200, null, "Club deleted successfully."));
});

export const superAccess = asyncHandler(async (req, res) => {
  const { count, offset, limit, data } = res.paginate;
  if (data.length === 0) {
    return res
      .status(200)
      .json(new apiResponse(200, [], "No Members in your club."));
  }
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { count, offset, limit, data },
        "Club Member retrived successfully."
      )
    );
});

export const changeRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const trimmedId = id.trim();
  const { role } = req.body;
  const user = await User.findById(trimmedId);
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { role: role },
    { new: true }
  );
  res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Members updated successfully."));
});

export const removeMember = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const trimmedId = id.trim(); // user id

    const updatedUser = await User.findByIdAndUpdate(
      trimmedId,
      {
        $pull: { clubId: req.club._id },
      },
      { new: true }
    ).session(session);

    const updatedClub = await Club.findByIdAndUpdate(
      req.club._id,
      {
        $pull: { members: trimmedId },
      },
      { new: true }
    ).session(session);

    if (!updatedUser || !updatedClub) {
      throw new apiError(404, "Some Error Occoured");
    }

    // check how many clubs the user is in
    const totalClubs = updatedUser.clubId;

    if (totalClubs.length === 0) {
      const deletedUser = await User.findByIdAndDelete(updatedUser._id).session(
        session
      );
      if (!deletedUser) {
        throw new apiError(404, "Some Error Occoured");
      }
    }
    session.commitTransaction();
    res.status(200).json(new apiResponse(200, "Member removed successfully."));
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    throw new apiError(500, "Error in deleting user.");
  } finally {
    await session.endSession();
  }
});


export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new apiError(400, "Please provide both email and password.");
  }

  const club = await Club.findOne({ serviceMail: email }).select("+password");
  if (!club) {
    throw new apiError(401, "Invalid email or password.");
  }

  const token = jwt.sign({ _id: club._id }, process.env.ACCESS_TOKEN_SECRET_ADMIN, { expiresIn: "1h" });


  res.cookie("clubT", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict",
    maxAge:24* 60 * 60 * 1000, // 1 day
  });

  res.status(200).json({
    message: "Login successful",
    token,
    club: {
      _id: club._id,
      clubName: club.clubName,
      email: club.serviceMail,
    },
  });
});