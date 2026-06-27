import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest } from '../../lib/api';

// Blood compatibility chart (key: recipient, value: compatible donor groups)
export const BLOOD_COMPATIBILITY = {
  'A+':  ['A+', 'A-', 'O+', 'O-'],
  'A-':  ['A-', 'O-'],
  'B+':  ['B+', 'B-', 'O+', 'O-'],
  'B-':  ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+':  ['O+', 'O-'],
  'O-':  ['O-'],
};

const formatDate = (value) => (value ? new Date(value).toISOString().split('T')[0] : '');
const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const mapDonor = (d) => ({
  id: d._id,
  userId: d.userId?._id,
  name: d.fullName,
  bloodGroup: d.bloodGroup,
  city: d.city,
  paid: d.paymentType === 'paid',
  contact: d.mobile,
  available: d.available,
  gender: d.gender,
  lastDonation: formatDate(d.lastDonationDate),
  donationCount: d.donationCount || 0,
  badge: d.badge || 'Bronze',
  online: false,
  distance: 0,
  coords: d.location,
});

const mapRequest = (r) => ({
  id: r._id,
  bloodGroup: r.bloodGroup,
  units: r.quantity,
  date: formatDate(r.date),
  time: r.time,
  hospital: r.hospitalName,
  city: r.city,
  reason: r.reason,
  address: r.fullAddress,
  status: r.status,
  urgent: r.urgent,
  contact: r.mobileNumber,
  userId: r.userId?._id || r.userId,
});

const mapEvent = (e) => ({
  id: e._id,
  name: e.eventName,
  date: formatDate(e.dateTime),
  time: formatTime(e.dateTime),
  venue: e.venue,
  city: e.city,
  type: e.eventType,
  address: e.address,
  capacity: e.capacity,
  contact: e.contactInfo || 'Not Provided',
  rsvpList: (e.rsvpList || []).map((id) => id.toString()),
  status: e.status,
});

const mapBank = (b) => ({
  id: b._id,
  ownerUserId: b.registeredBy?._id,
  name: b.name,
  city: b.city,
  contact: b.contact,
  location: b.address,
  status: b.status,
  bloodStock: b.bloodStock || {},
  coords: b.location,
});

const mapNews = (n) => ({
  id: n._id,
  title: n.title,
  content: n.content,
  date: formatDate(n.createdAt),
});

const mapNotification = (n, currentUserId) => ({
  id: n._id,
  type: n.type || 'info',
  title: n.title,
  body: n.body,
  time: formatDate(n.createdAt),
  read: (n.readBy || []).includes(currentUserId)
});

export const fetchDashboardData = createAsyncThunk('data/fetchDashboardData', async (_, { getState, rejectWithValue }) => {
  try {
    const currentUserId = getState().auth.user?._id;
    const [usersRes, donorsRes, requestsRes, eventsRes, banksRes, newsRes, statsRes, notifRes] = await Promise.all([
      apiRequest('/users').catch(() => ({ users: [] })),
      apiRequest('/donors'),
      apiRequest('/requests'),
      apiRequest('/events'),
      apiRequest('/banks'),
      apiRequest('/news'),
      apiRequest('/users/stats').catch(() => ({ stats: {} })),
      apiRequest('/notifications').catch(() => ({ notifications: [] })),
    ]);

    return {
      systemUsers: (usersRes.users || []).map((u) => ({ id: u._id, identifier: u.username, role: u.role })),
      donors: (donorsRes.donors || []).map(mapDonor),
      requests: (requestsRes.requests || []).map(mapRequest),
      events: (eventsRes.events || []).map(mapEvent),
      bloodBanks: (banksRes.banks || []).map(mapBank),
      news: (newsRes.news || []).map(mapNews),
      stats: statsRes.stats || {},
      notifications: (notifRes.notifications || []).map(n => mapNotification(n, currentUserId)),
    };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Public (non-auth) events feed.
export const fetchPublicEvents = createAsyncThunk('data/fetchPublicEvents', async (_, { rejectWithValue }) => {
  try {
    const eventsRes = await apiRequest('/events');
    return (eventsRes.events || []).map(mapEvent);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const createBloodRequest = createAsyncThunk('data/createBloodRequest', async (requestData) => {
  const payload = await apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify({
      bloodGroup: requestData.bloodGroup,
      quantity: Number(requestData.units || requestData.quantity),
      hospitalName: requestData.hospitalName,
      reason: requestData.reason,
      date: requestData.date,
      time: requestData.time,
      contactInfo: requestData.mobileNumber,
      mobileNumber: requestData.mobileNumber,
      fullAddress: requestData.fullAddress,
      city: requestData.city,
      urgent: Boolean(requestData.urgent),
    }),
  });
  return mapRequest(payload.request);
});

export const updateRequestStatusApi = createAsyncThunk('data/updateRequestStatusApi', async ({ id, status }) => {
  const payload = await apiRequest(`/requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapRequest(payload.request);
});

// Donor confirms they donated for a matching request (starts cooldown + fulfills request)
export const donateToRequestApi = createAsyncThunk('data/donateToRequestApi', async (requestId, { rejectWithValue }) => {
  try {
    await apiRequest(`/requests/${requestId}/donate`, {
      method: 'POST',
      body: JSON.stringify({ didDonate: true }),
    });
    return requestId;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const createEventApi = createAsyncThunk('data/createEventApi', async (eventData) => {
  const dateTime = new Date(`${eventData.date}T${eventData.time}`);
  const payload = await apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify({
      eventName: eventData.name,
      email: eventData.email,
      phone: eventData.phone,
      eventType: eventData.type,
      dateTime: dateTime.toISOString(),
      venue: eventData.venue,
      address: eventData.address,
      city: eventData.city,
      postalCode: eventData.postalCode,
      capacity: Number(eventData.capacity),
    }),
  });
  return mapEvent(payload.event);
});

export const deleteEventApi = createAsyncThunk('data/deleteEventApi', async (id) => {
  await apiRequest(`/events/${id}`, { method: 'DELETE' });
  return id;
});

export const toggleRsvpApi = createAsyncThunk('data/toggleRsvpApi', async (eventId) => {
  const payload = await apiRequest(`/events/${eventId}/rsvp`, { method: 'POST' });
  return payload.event;
});

export const registerDonorApi = createAsyncThunk('data/registerDonorApi', async (donorData) => {
  const payload = await apiRequest('/donors', {
    method: 'POST',
    body: JSON.stringify({
      fullName: donorData.fullName,
      mobile: donorData.contact,
      bloodGroup: donorData.bloodGroup,
      city: donorData.city,
      dateOfBirth: donorData.dob,
      weight: Number(donorData.weight),
      gender: donorData.gender,
      available: donorData.available === 'true',
      paymentType: donorData.paid === 'true' ? 'paid' : 'unpaid',
    }),
  });
  return mapDonor(payload.donor);
});

export const registerBloodBankApi = createAsyncThunk('data/registerBloodBankApi', async (bankData) => {
  const payload = await apiRequest('/banks', {
    method: 'POST',
    body: JSON.stringify({
      name: bankData.name,
      contact: bankData.contact,
      city: bankData.city,
      address: bankData.address,
      location: bankData.location,
      license: bankData.license,
    }),

  });
  return mapBank(payload.bank);
});

export const updateBloodStockApi = createAsyncThunk('data/updateBloodStockApi', async ({ id, bloodStock }) => {
  const payload = await apiRequest(`/banks/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ bloodStock }),
  });
  return mapBank(payload.bank || { ...payload, _id: id }); // Handle varied response formats
});

export const createNewsApi = createAsyncThunk('data/createNewsApi', async (newsData) => {
  const payload = await apiRequest('/news', {
    method: 'POST',
    body: JSON.stringify(newsData),
  });
  return mapNews(payload.news);
});

export const deleteNewsApi = createAsyncThunk('data/deleteNewsApi', async (id) => {
  await apiRequest(`/news/${id}`, { method: 'DELETE' });
  return id;
});

// Admin Thunks
export const deleteUserApi = createAsyncThunk('data/deleteUserApi', async (id) => {
  await apiRequest(`/users/${id}`, { method: 'DELETE' });
  return id;
});

export const deleteRequestApi = createAsyncThunk('data/deleteRequestApi', async (id) => {
  await apiRequest(`/requests/${id}`, { method: 'DELETE' });
  return id;
});

export const deleteBankApi = createAsyncThunk('data/deleteBankApi', async (id) => {
  await apiRequest(`/banks/${id}`, { method: 'DELETE' });
  return id;
});

export const markNotificationReadApi = createAsyncThunk('data/markNotificationReadApi', async (id) => {
  await apiRequest(`/notifications/read/${id}`, { method: 'POST' });
  return id;
});

export const markAllNotificationsReadApi = createAsyncThunk('data/markAllNotificationsReadApi', async (_, { getState }) => {
  const { notifications } = getState().data;
  const unread = (notifications || []).filter(n => !n.read);
  await Promise.all(unread.map(n => apiRequest(`/notifications/read/${n.id}`, { method: 'POST' })));
  return true;
});

export const updateBankStatusApi = createAsyncThunk('data/updateBankStatusApi', async ({ id, status }) => {
  const payload = await apiRequest(`/banks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapBank(payload.bank);
});

export const updateEventStatusApi = createAsyncThunk('data/updateEventStatusApi', async ({ id, status }) => {
  const payload = await apiRequest(`/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapEvent(payload.event);
});

export const fetchMyDonorProfileApi = createAsyncThunk('data/fetchMyDonorProfileApi', async (_, { rejectWithValue }) => {
  try {
    const res = await apiRequest('/donors/me');
    return mapDonor(res.donor);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const logManualDonationApi = createAsyncThunk('data/logManualDonationApi', async (donationData, { rejectWithValue }) => {
  try {
    const res = await apiRequest('/donors/me/log-donation', {
      method: 'PATCH',
      body: JSON.stringify(donationData),
    });
    return mapDonor(res.donor);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateBloodBankApi = createAsyncThunk('data/updateBloodBankApi', async ({ id, ...bankData }, { rejectWithValue }) => {
  try {
    const res = await apiRequest(`/banks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(bankData),
    });
    return mapBank(res.bank);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateEventApi = createAsyncThunk('data/updateEventApi', async ({ id, ...eventData }, { rejectWithValue }) => {
  try {
    const res = await apiRequest(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
    return mapEvent(res.event);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const updateMyDonorProfileApi = createAsyncThunk('data/updateMyDonorProfileApi', async (updateData, { rejectWithValue }) => {
  try {
    const res = await apiRequest('/donors/me', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return mapDonor(res.donor);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const initialState = {
  systemUsers: [],
  donors: [],
  myDonorProfile: null,
  requests: [],
  events: [],
  bloodBanks: [],
  news: [],
  notifications: [],
  donations: [],
  chats: [],
  stats: {
    totalUsers: 0,
    totalDonors: 0,
    activeDonors: 0,
    totalBanks: 0,
    totalRequests: 0,
    totalEvents: 0
  },
  emergencyActive: false,
  loading: false,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift({ id: Date.now(), read: false, time: 'just now', ...action.payload });
    },
    updateDonorAvailability: (state, action) => {
      const { id, available } = action.payload;
      const donor = state.donors.find(d => d.id === id);
      if (donor) donor.available = available;
    },
    sendMessage: (state, action) => {
      state.chats.push({ id: Date.now(), timestamp: new Date().toISOString(), read: false, ...action.payload });
    },
    markRead: (state, action) => {
      const msg = state.chats.find(c => c.id === action.payload);
      if (msg) msg.read = true;
    },
    updateBloodBankStatus: (state, action) => {
      const { id, status } = action.payload;
      const bank = state.bloodBanks.find(b => b.id === id);
      if (bank) bank.status = status;
    },
    markNotificationRead: (state, action) => {
      const n = state.notifications.find(n => n.id === action.payload);
      if (n) n.read = true;
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    setEmergencyActive: (state, action) => {
      state.emergencyActive = action.payload;
    },
    addDonation: (state, action) => {
      state.donations.push({ id: Date.now(), ...action.payload });
      // Update donor stats
      const donor = state.donors.find(d => d.id === action.payload.donorId);
      if (donor) {
        donor.donationCount += 1;
        donor.lastDonation = action.payload.date;
        if (donor.donationCount >= 10) donor.badge = 'Gold';
        else if (donor.donationCount >= 4) donor.badge = 'Silver';
        else donor.badge = 'Bronze';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.systemUsers = action.payload.systemUsers;
        state.donors = action.payload.donors;
        state.requests = action.payload.requests;
        state.events = action.payload.events;
        state.bloodBanks = action.payload.bloodBanks;
        state.news = action.payload.news;
        state.stats = action.payload.stats;
        state.notifications = action.payload.notifications;
        
        // Auto-detect if any emergency is active from the requests list
        state.emergencyActive = (action.payload.requests || []).some(r => r.urgent && r.status === 'approved');
      })
      .addCase(fetchPublicEvents.fulfilled, (state, action) => {
        state.events = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createBloodRequest.fulfilled, (state, action) => {
        state.requests.unshift(action.payload);
      })
      .addCase(updateRequestStatusApi.fulfilled, (state, action) => {
        const idx = state.requests.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.requests[idx] = action.payload;
      })
      .addCase(donateToRequestApi.fulfilled, (state, action) => {
        const reqId = action.payload;
        const idx = state.requests.findIndex((r) => r.id === reqId);
        if (idx !== -1) {
          state.requests[idx].status = 'fulfilled';
        }
      })
      .addCase(registerDonorApi.fulfilled, (state, action) => {
        state.donors.unshift(action.payload);
      })
      .addCase(createEventApi.fulfilled, (state, action) => {
        state.events.unshift(action.payload);
      })
      .addCase(deleteEventApi.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e.id !== action.payload);
      })
      .addCase(toggleRsvpApi.fulfilled, (state, action) => {
        const updatedEvent = action.payload;
        const idx = state.events.findIndex((e) => e.id === updatedEvent.id);
        if (idx !== -1) {
          state.events[idx] = mapEvent(updatedEvent);
        }
      })
      .addCase(registerBloodBankApi.fulfilled, (state, action) => {
        state.bloodBanks.unshift(action.payload);
      })
      .addCase(updateBloodStockApi.fulfilled, (state, action) => {
        const idx = state.bloodBanks.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) {
          state.bloodBanks[idx].bloodStock = action.payload.bloodStock;
        }
      })
      .addCase(createNewsApi.fulfilled, (state, action) => {
        state.news.unshift(action.payload);
      })
      .addCase(deleteNewsApi.fulfilled, (state, action) => {
        state.news = state.news.filter((n) => n.id !== action.payload);
      })
      .addCase(deleteUserApi.fulfilled, (state, action) => {
        state.systemUsers = state.systemUsers.filter(u => u.id !== action.payload);
      })
      .addCase(deleteRequestApi.fulfilled, (state, action) => {
        state.requests = state.requests.filter(r => r.id !== action.payload);
      })
      .addCase(deleteBankApi.fulfilled, (state, action) => {
        state.bloodBanks = state.bloodBanks.filter(b => b.id !== action.payload);
      })
      .addCase(markNotificationReadApi.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n.id === action.payload);
        if (n) n.read = true;
      })
      .addCase(markAllNotificationsReadApi.fulfilled, (state) => {
        state.notifications.forEach(n => n.read = true);
      })
      .addCase(updateBankStatusApi.fulfilled, (state, action) => {
        const idx = state.bloodBanks.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.bloodBanks[idx].status = action.payload.status;
      })
      .addCase(updateEventStatusApi.fulfilled, (state, action) => {
        const idx = state.events.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.events[idx].status = action.payload.status;
      })
      .addCase(fetchMyDonorProfileApi.fulfilled, (state, action) => {
        state.myDonorProfile = action.payload;
      })
      .addCase(logManualDonationApi.fulfilled, (state, action) => {
        state.myDonorProfile = action.payload;
        // Also update in donors list if present
        const idx = state.donors.findIndex(d => d.id === action.payload.id);
        if (idx !== -1) state.donors[idx] = action.payload;
      })
      .addCase(updateBloodBankApi.fulfilled, (state, action) => {
        const idx = state.bloodBanks.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.bloodBanks[idx] = action.payload;
      })
      .addCase(updateEventApi.fulfilled, (state, action) => {
        const idx = state.events.findIndex(e => e.id === action.payload.id);
        if (idx !== -1) state.events[idx] = action.payload;
      })
      .addCase(updateMyDonorProfileApi.fulfilled, (state, action) => {
        state.myDonorProfile = action.payload;
        const idx = state.donors.findIndex(d => d.id === action.payload.id);
        if (idx !== -1) state.donors[idx] = action.payload;
      });
  },
});

export const { 
  updateDonorAvailability,
  sendMessage, markRead,
  updateBloodBankStatus,
  markNotificationRead, markAllNotificationsRead, addNotification,
  setEmergencyActive,
  addDonation
} = dataSlice.actions;

export default dataSlice.reducer;
