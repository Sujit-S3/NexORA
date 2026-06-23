// NexORA — Category Controller
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const slugify = require('slugify');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().populate('parent', 'name slug');
  sendResponse(res, 200, 'Categories retrieved successfully', categories);
});

// @desc    Get category by slug
// @route   GET /api/categories/:slug
// @access  Public
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).populate('parent', 'name slug');
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  sendResponse(res, 200, 'Category retrieved successfully', category);
});

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, isActive } = req.body;

  if (!name) {
    throw ApiError.badRequest('Category name is required');
  }

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw ApiError.badRequest('Category with this name already exists');
  }

  let imageData = { url: '', publicId: '' };

  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'nexora/categories');
    imageData = { url: result.secure_url, publicId: result.public_id };
  }

  const category = await Category.create({
    name,
    description,
    parent: parent || null,
    isActive: isActive !== undefined ? isActive : true,
    image: imageData
  });

  sendResponse(res, 201, 'Category created successfully', category);
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, isActive } = req.body;

  let category = await Category.findById(req.params.id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Update slug if name changes
  if (name && name !== category.name) {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory && existingCategory._id.toString() !== category._id.toString()) {
      throw ApiError.badRequest('Category with this name already exists');
    }
    category.name = name;
    category.slug = slugify(name, { lower: true, strict: true });
  }

  if (description !== undefined) category.description = description;
  if (parent !== undefined) category.parent = parent || null;
  if (isActive !== undefined) category.isActive = isActive;

  if (req.file) {
    // Delete old image if exists
    if (category.image && category.image.publicId) {
      await deleteFromCloudinary(category.image.publicId);
    }
    const result = await uploadToCloudinary(req.file.buffer, 'nexora/categories');
    category.image = { url: result.secure_url, publicId: result.public_id };
  }

  await category.save();

  sendResponse(res, 200, 'Category updated successfully', category);
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Check if it has child categories
  const children = await Category.find({ parent: category._id });
  if (children.length > 0) {
    throw ApiError.badRequest('Cannot delete category with nested sub-categories');
  }

  // Check if any products are using it
  // We'll require Product model
  const Product = require('../models/Product');
  const products = await Product.find({ category: category._id });
  if (products.length > 0) {
    throw ApiError.badRequest('Cannot delete category containing products');
  }

  if (category.image && category.image.publicId) {
    await deleteFromCloudinary(category.image.publicId);
  }

  await category.deleteOne();

  sendResponse(res, 200, 'Category deleted successfully');
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
