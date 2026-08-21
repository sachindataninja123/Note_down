import api from "../../api/axiosInstance";

// GET /api/v1/categories
const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

// POST /api/v1/categories
const createCategory = async (categoryData) => {
  const response = await api.post("/categories", categoryData);
  return response.data;
};

// PUT /api/v1/categories/:id
const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

// DELETE /api/v1/categories/:id
const deleteCategory = async (categoryId) => {
  const response = await api.delete(`/categories/${categoryId}`);
  return { categoryId, ...response.data };
};

const categoryService = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;