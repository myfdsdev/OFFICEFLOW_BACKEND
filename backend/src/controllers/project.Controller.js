import Project from '../models/Project.js';
import ProjectMember from '../models/ProjectMember.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create project
export const createProject = asyncHandler(async (req, res) => {
  const { project_name, description, priority, start_date, end_date, color, members = [] } = req.body;

  if (!project_name) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const project = await Project.create({
    project_name,
    description: description || '',
    created_by: req.user._id,
    created_by_name: req.user.full_name,
    priority: priority || 'medium',
    start_date,
    end_date,
    color: color || '#3B82F6',
  });

  // Creator auto-added as owner
  await ProjectMember.create({
    project_id: project._id,
    project_name: project.project_name,
    user_id: req.user._id,
    user_email: req.user.email,
    user_name: req.user.full_name,
    role: 'owner',
  });

  // Additional members
  if (members.length) {
    const memberDocs = members.map((m) => ({
      project_id: project._id,
      project_name: project.project_name,
      user_id: m.user_id,
      user_email: m.user_email,
      user_name: m.user_name,
      role: m.role || 'member',
    }));
    await ProjectMember.insertMany(memberDocs);

    await Notification.insertMany(
      members.map((m) => ({
        user_email: m.user_email,
        title: 'Added to Project',
        message: `You've been added to "${project.project_name}"`,
        type: 'project_assigned',
        related_id: project._id.toString(),
      }))
    );
  }

  res.status(201).json(project);
});

// @desc    Get all projects (with membership filter for non-admin)
export const getAllProjects = asyncHandler(async (req, res) => {
  const { is_archived, status, sort = '-createdAt' } = req.query;

  const filter = {};
  if (is_archived !== undefined) filter.is_archived = is_archived === 'true';
  if (status) filter.status = status;

  if (req.user.role !== 'admin') {
    const memberships = await ProjectMember.find({ user_id: req.user._id }).select('project_id');
    filter._id = { $in: memberships.map((m) => m.project_id) };
  }

  const projects = await Project.find(filter).sort(sort);
  res.json(projects);
});

// @desc    Filter projects (base44 pattern)
export const filterProjects = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  // Non-admin: restrict to member projects
  if (req.user.role !== 'admin') {
    const memberships = await ProjectMember.find({ user_id: req.user._id }).select('project_id');
    const memberProjectIds = memberships.map((m) => m.project_id.toString());

    if (filter._id) {
      // Specific project requested — check user is a member
      const requestedId = filter._id.toString();
      if (!memberProjectIds.includes(requestedId)) {
        return res.json([]);
      }
    } else {
      filter._id = { $in: memberProjectIds };
    }
  }

  const projects = await Project.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(projects);
});

// @desc    Get project by ID
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (req.user.role !== 'admin') {
    const isMember = await ProjectMember.findOne({
      project_id: project._id,
      user_id: req.user._id,
    });
    if (!isMember) return res.status(403).json({ error: 'Access denied' });
  }

  res.json(project);
});

// @desc    Update project
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const member = await ProjectMember.findOne({
    project_id: project._id,
    user_id: req.user._id,
  });
  const isCreator = project.created_by.toString() === req.user._id.toString();
  const canEdit =
    req.user.role === 'admin' ||
    isCreator ||
    (member && ['owner', 'admin'].includes(member.role));

  if (!canEdit) return res.status(403).json({ error: 'Access denied' });

  const allowedFields = [
    'project_name', 'description', 'status', 'priority',
    'start_date', 'end_date', 'is_archived', 'color', 'notes',
  ];
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  });

  await project.save();

  if (req.body.project_name) {
    await ProjectMember.updateMany(
      { project_id: project._id },
      { project_name: project.project_name }
    );
  }

  res.json(project);
});

// @desc    Delete project
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const member = await ProjectMember.findOne({
    project_id: project._id,
    user_id: req.user._id,
  });
  const isCreator = project.created_by.toString() === req.user._id.toString();
  const canDelete =
    req.user.role === 'admin' ||
    isCreator ||
    (member && member.role === 'owner');

  if (!canDelete) return res.status(403).json({ error: 'Access denied' });

  await Task.deleteMany({ project_id: project._id });
  await ProjectMember.deleteMany({ project_id: project._id });
  await project.deleteOne();

  res.json({ message: 'Project deleted' });
});

// @desc    Archive/unarchive project
export const toggleArchive = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  project.is_archived = !project.is_archived;
  await project.save();

  res.json(project);
});