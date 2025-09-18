// Admin configuration
export const ADMIN_EMAILS = [
  "oleg@luckyhospitality.com",
  "contact@bunkerdc.com",
  "ryan@bunkerdc.com"
];

export const isAdmin = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};

export const getAdminRole = (email) => {
  const roles = {
    "oleg@luckyhospitality.com": "super_admin",
    "contact@bunkerdc.com": "super_admin",

  };
  return roles[email?.toLowerCase()] || null;
};
