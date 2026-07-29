import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const redeemInvite = async (token: string): Promise<string | null> => {
  try {
    const authToken = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/study-groups/invites/redeem/${token}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (res.ok) {
      toast.success("Successfully joined the study group!");
      return data.groupId || data.group?._id || "joined";
    } else {
      toast.error(data.message || "Failed to redeem invite.");
      return null;
    }
  } catch (err) {
    console.error("Error redeeming invite:", err);
    toast.error("Network error while joining group.");
    return null;
  }
};
