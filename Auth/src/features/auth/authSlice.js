import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest, clearCsrfToken } from '../../lib/api';

const normalizeUser = (user) => ({
  ...user,
  identifier: user?.username || user?.email || user?.phone || 'User',
});

export const signupUser = createAsyncThunk('auth/signupUser', async (formData) => {
  const payload = await apiRequest('/auth/signup/send-otp', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  return payload;
});

export const signinUser = createAsyncThunk('auth/signinUser', async ({ identifier, password }) => {
  const payload = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  clearCsrfToken();
  return normalizeUser(payload.user);
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const payload = await apiRequest('/auth/me');
  return normalizeUser(payload.user);
});

export const signoutUser = createAsyncThunk('auth/signoutUser', async () => {
  await apiRequest('/auth/logout', { method: 'POST' });
  clearCsrfToken();
  return true;
});

const initialState = {
  isAuthenticated: false,
  user: null,
  role: 'user',
  loading: false,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.role = 'user';
    },
    switchRole: (state, action) => {
      state.role = action.payload || state.role;
      if (state.user) {
        state.user.role = state.role;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role || 'user';
      })
      .addCase(signupUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      })
      .addCase(signinUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(signinUser.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role || 'user';
      })
      .addCase(signinUser.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
      })
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.role = action.payload.role || 'user';
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false;
        state.initialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.role = 'user';
      })
      .addCase(signoutUser.fulfilled, (state) => {
        state.initialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.role = 'user';
      });
  },
});

export const { logout, switchRole } = authSlice.actions;
export default authSlice.reducer;
