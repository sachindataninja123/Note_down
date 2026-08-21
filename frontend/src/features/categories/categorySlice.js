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
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addCategory = createAsyncThunk(
  "categories/add",
  async (categoryData, thunkAPI) => {
    try {
      return await categoryService.createCategory(categoryData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const editCategory = createAsyncThunk(
  "categories/edit",
  async ({ categoryId, categoryData }, thunkAPI) => {
    try {
      return await categoryService.updateCategory(categoryId, categoryData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeCategory = createAsyncThunk(
  "categories/remove",
  async (categoryId, thunkAPI) => {
    try {
      return await categoryService.deleteCategory(categoryId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
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
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.data || [];
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload.data);
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        const updated = action.payload.data;
        const index = state.categories.findIndex((c) => c._id === updated._id);
        if (index !== -1) state.categories[index] = updated;
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter((c) => c._id !== action.payload.categoryId);
        if (state.selectedCategory === action.payload.categoryId) {
          state.selectedCategory = "All";
        }
      });
  },
});

export const { setSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer;