export const formatUser = (user) => {
  if (!user) return null;

  return {
    id:                user.id,
    companyId:         user.companyId,
    firstName:         user.firstName ?? null,
    lastName:          user.lastName  ?? null,
    name:              user.name,
    loginId:           user.loginId,
    email:             user.email,
    role:              user.role,
    joiningDate:       user.joiningDate   ?? null,
    basicSalary:       user.basicSalary   ?? null,
    pfNumber:          user.pfNumber      ?? null,
    avatarUrl:          user.avatarUrl         ?? null,
    mustChangePassword: user.mustChangePassword ?? false,
    createdAt:         user.createdAt,
    ...(user.company ? { companyName: user.company.name, companyCode: user.company.code } : {}),
  };
};
