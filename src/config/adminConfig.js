// Admin configuration
export const ADMIN_EMAILS = [
  "oleg@luckyhospitality.com",
  "supervisor@luckyhospitality.com",
  // Add more admin emails here
];

export const isAdmin = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};

export const getAdminRole = (email) => {
  const roles = {
    "oleg@luckyhospitality.com": "super_admin",
    "supervisor@luckyhospitality.com": "supervisor",
  };
  return roles[email?.toLowerCase()] || null;
};
