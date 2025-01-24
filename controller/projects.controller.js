import asyncHandler from "../utils/asyncHandler.js";
import Project from "../model/project.model.js";
import apiError from "../utils/apiError.js";
import { Club } from "../model/club.model.js";
import apiResponse from "../utils/apiResponse.js";

export const createProject = asyncHandler(async (req, res) => {
    const clubId = req.club._id;
    const { header, description,link,domain,status } = req.body;
  console.log(req.body);
  const club = await Club.findById(clubId);
  if (!club) {
    throw new apiError(404, "Club not found");
  }
  
    const newProject = await Project.create({
      header,
      description,
      clubId,
      link,domain,status,
      Image: club.clubLogo,
    });
  
    if (!newProject) {
      throw new apiError(500, "Error in creating project.");
    }
  
    return res
      .status(200)
      .json(
        new apiResponse(201, newProject, "project created successfully.")
      );
  });

export const AllProjects = asyncHandler(async (req, res, next) => {
 
  
  const project = await Project.find();


    if (!project || project.length === 0) {
      throw new apiError(404, [], "There is no Project in this club.");
    }

    return res
    .status(200)
    .json(
      new apiResponse(
        200,
        project,
        " Projects retrieved successfully."
      )
    );
  
  
});

export const updateProject = asyncHandler(async (req, res) => {
    const clubId = req.club._id;
    const { id } = req.params;
    const trimmedId = id.trim();
    const club = await Club.findById(clubId);
    if (!club) {
      throw new apiError(404, "Club not found");
    }
    const { header, description,link,domain,status } = req.body;
    const project = await Project.findByIdAndUpdate(trimmedId, {
      header,
      description,
      clubId,link,domain,status, Image: club.clubLogo,
    });
    if (!Project) {
      throw new apiError(404, "Error in updating achievement.");
    }
    return res
      .status(200)
      .json(
        new apiResponse(200, project, "Achievement updated successfully")
      );
  });

export const deleteProject = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trimmedId = id.trim();
    const project = await Project.findByIdAndDelete(trimmedId);
    if (!project) {
      throw new apiError(404, "Error in deleting achievement.");
    }
    return res
      .status(200)
      .json(
        new apiResponse(200, project, "Achievement deleted successfully.")
      );
  });

export const getUpComingProject = asyncHandler(async (req, res) => {
    const upComingProject = await Project.find()
      .sort({ createdAt: -1 })
      .limit(3);
    if (!upComingProject) {
      throw new apiError(404, [], "There is no achievement in this club.");
    }
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          upComingProject,
          "Upcoming achievements retrieved successfully."
        )
      );
  });