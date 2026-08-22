import api from "../../api/axiosInstance";

const getInviteInfo = async (token) => {
  const res = await api.get(`/invitations/${token}`);
  return res.data;
};

const acceptInvite = async (token) => {
  const res = await api.post(`/invitations/${token}/accept`);
  return res.data;
};

const rejectInvite = async (token) => {
  const res = await api.post(`/invitations/${token}/reject`);
  return res.data;
};

const invitationService = { getInviteInfo, acceptInvite, rejectInvite };
export default invitationService;