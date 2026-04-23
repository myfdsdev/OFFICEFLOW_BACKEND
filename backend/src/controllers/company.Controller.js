import Company from '../models/Company.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create company
// @route   POST /api/companies
// @access  Private
export const createCompany = asyncHandler(async (req, res) => {
  const { company_name, subscription_plan, payment_method, address, phone, website, logo } = req.body;

  if (!company_name) {
    return res.status(400).json({ error: 'Company name required' });
  }

  // Check if user already owns a company
  const existing = await Company.findOne({ owner_id: req.user._id });
  if (existing) {
    return res.status(400).json({ error: 'You already own a company' });
  }

  const company = await Company.create({
    company_name,
    owner_id: req.user._id,
    owner_email: req.user.email,
    subscription_plan: subscription_plan || 'free',
    subscription_status: 'active',
    payment_method: payment_method || '',
    address: address || '',
    phone: phone || '',
    website: website || '',
    logo: logo || '',
  });

  // Link company to user
  await User.findByIdAndUpdate(req.user._id, { company_id: company._id });

  res.status(201).json(company);
});

// @desc    Get all companies (admin) or own company
// @route   GET /api/companies
// @access  Private
export const getCompanies = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  // Non-admin: only own company
  if (req.user.role !== 'admin') {
    filter.owner_id = req.user._id;
  }

  const companies = await Company.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(companies);
});

// @desc    Filter companies (base44 pattern)
// @route   GET /api/companies/filter
// @access  Private
export const filterCompanies = asyncHandler(async (req, res) => {
  const filter = { ...req.query };
  delete filter.sort;
  delete filter.limit;

  if (req.user.role !== 'admin') {
    filter.owner_id = req.user._id;
  }

  const companies = await Company.find(filter)
    .sort(req.query.sort || '-createdAt')
    .limit(parseInt(req.query.limit) || 100);

  res.json(companies);
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
export const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  // Access: owner or system admin
  const isOwner = company.owner_id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(company);
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (owner/admin)
export const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const isOwner = company.owner_id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const allowed = [
    'company_name', 'subscription_plan', 'subscription_status',
    'payment_method', 'address', 'phone', 'website', 'logo',
    'max_users', 'stripe_customer_id',
  ];
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) company[f] = req.body[f];
  });

  await company.save();
  res.json(company);
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (owner/admin)
export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const isOwner = company.owner_id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Unlink from users
  await User.updateMany({ company_id: company._id }, { company_id: null });

  await company.deleteOne();
  res.json({ message: 'Company deleted' });
});