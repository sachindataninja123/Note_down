import api from "../../api/axiosInstance";
import { todayKey } from "../../utils/dates";

// GET /api/v1/analytics
// `today` and `tz` tell the server which day it is for THIS viewer, so
// "overdue" and "completed on day X" match what they see on their calendar.
const getAnalytics = async (workspace, { range = 30 } = {}) => {
  const response = await api.get("/analytics", {
    params: {
      workspace: workspace || "personal",
      range,
      today: todayKey(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  return response.data.data;
};

const analyticsService = { getAnalytics };
export default analyticsService;