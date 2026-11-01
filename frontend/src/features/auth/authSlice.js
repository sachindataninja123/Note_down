import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "./authService";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isAuthChecked: false,
  isSuccess: false,
  isError: false,
  message: "",
  resetToken: null, // Temporary token issued after OTP verification
  otpSent: false,
  otpVerified: false,
};

// 1. Register Thunk
export const register = createAsyncThunk(
  "auth/register",
  async (user, thunkAPI) => {
    try {
      return await authService.register(user);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 2. Login Thunk
export const login = createAsyncThunk("auth/login", async (user, thunkAPI) => {
  try {
    return await authService.login(user);
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Login failed";
    return thunkAPI.rejectWithValue(message);
  }
});

// 3. Get Current User Profile
export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, thunkAPI) => {
    try {
      return await authService.getProfile();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch profile";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 4. Logout Thunk
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    return await authService.logout();
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Logout failed";
    return thunkAPI.rejectWithValue(message);
  }
});

export const updateProfileImg = createAsyncThunk(
  "auth/updateProfileImg",
  async (data, thunkAPI) => {
    try {
      return await authService.updateProfilePic(data);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Update Profile Image failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const deleteProfileImg = createAsyncThunk(
  "auth/deleteProfileImg",
  async (_, thunkAPI) => {
    try {
      return await authService.deleteProfilePic();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Delete Profile Image failed";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 5. Forgot Password (Request OTP)
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, thunkAPI) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset OTP";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 6. Verify Reset OTP
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, thunkAPI) => {
    try {
      return await authService.verifyOtp({ email, otp });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify OTP";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 7. Reset Password with Reset Token
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, newPassword }, thunkAPI) => {
    try {
      return await authService.resetPassword({ resetToken, newPassword });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to reset password";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

// 8. Change Password (For Logged-in Users)
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ oldPassword, newPassword }, thunkAPI) => {
    try {
      return await authService.changePassword({ oldPassword, newPassword });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to change password";
      return thunkAPI.rejectWithValue(message);
    }
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    clearResetFlow: (state) => {
      state.resetToken = null;
      state.otpSent = false;
      state.otpVerified = false;
      state.message = "";
      state.isError = false;
      state.isSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message || "Registered successfully";
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isAuthenticated = true;
        state.user = action.payload.data?.user || action.payload.data;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isAuthenticated = false;
        state.user = null;
        state.message = action.payload;
      })

      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        state.isAuthenticated = true;
        state.user = action.payload.data;
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false;
        state.isAuthChecked = true;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Update Profile Image
      .addCase(updateProfileImg.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })

      .addCase(updateProfileImg.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        // Update user in Redux store
        state.user = action.payload.data;

        state.message =
          action.payload.message || "Profile image updated successfully";
      })

      .addCase(updateProfileImg.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Delete Profile Image
      .addCase(deleteProfileImg.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })

      .addCase(deleteProfileImg.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;

        // Update user in Redux store
        state.user = action.payload.data;

        state.message =
          action.payload.message || "Profile image deleted successfully";
      })

      .addCase(deleteProfileImg.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = false;
        state.message = "";
      })

      // Forgot Password (Request OTP)
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.otpSent = true;
        state.message = action.payload.message || "OTP sent successfully";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.otpVerified = true;
        state.resetToken = action.payload.data?.resetToken;
        state.message = action.payload.message || "OTP verified";
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.resetToken = null;
        state.otpSent = false;
        state.otpVerified = false;
        state.message = action.payload.message || "Password reset successfully";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message =
          action.payload.message || "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetAuthStatus, clearResetFlow } = authSlice.actions;
export default authSlice.reducer;
