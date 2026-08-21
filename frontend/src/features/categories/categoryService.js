import api from "../../api/axiosInstance";

const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

const createCategory = async (categoryData) => {
  const response = await api.post("/categories", categoryData);
  return response.data;
};

const updateCategory = async (categoryId, categoryData) => {
  const response = await api.put(`/categories/${categoryId}`, categoryData);
  return response.data;
};

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
