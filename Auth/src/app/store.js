import { configureStore } from '@reduxjs/toolkit';
import themeReducer from '../features/theme/themeSlice';
import authReducer from '../features/auth/authSlice';
import dataReducer from '../features/data/dataSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    data: dataReducer,
  },
});
