import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import categoryService from "./categoryService";

const initialState = {
  categories: [],
  selectedCategory: "All",
  isLoading: false,
  isError: false,
  message: "",
};

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, thunkAPI) => {
    try {
      return await categoryService.getCategories();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to load categories";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const addCategory = createAsyncThunk(
  "categories/add",
  async (categoryData, thunkAPI) => {
    try {
      return await categoryService.createCategory(categoryData);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create category";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const removeCategory = createAsyncThunk(
  "categories/remove",
  async (categoryId, thunkAPI) => {
    try {
      return await categoryService.deleteCategory(categoryId);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete category";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.data || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Add Category
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload.data);
      })

      // Delete Category
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(
          (c) => c._id !== action.payload.categoryId,
        );
        if (state.selectedCategory === action.payload.categoryId) {
          state.selectedCategory = "All";
        }
      });
  },
});

export const { setSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;
