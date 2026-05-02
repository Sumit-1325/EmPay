export const formatUser = (user) => {
  if (!user) return null;

  return {
    id:                 user.id,
    companyId:          user.companyId,
    firstName:          user.firstName  ?? null,
    lastName:           user.lastName   ?? null,
    name:               user.name,
    loginId:            user.loginId,
    email:              user.email,
    role:               user.role,
    joiningDate:        user.joiningDate  ?? null,
    basicSalary:        user.basicSalary  ?? null,
    pfNumber:           user.pfNumber     ?? null,
    avatarUrl:          user.avatarUrl    ?? null,
    mobile:             user.mobile       ?? null,
    location:           user.location     ?? null,
    about:              user.about        ?? null,
    jobPassion:         user.jobPassion   ?? null,
    interests:          user.interests    ?? null,
    monthlyWage:        user.monthlyWage  ?? null,
    pfRate:             user.pfRate       ?? 12,
    workingDaysPerWeek: user.workingDaysPerWeek ?? 5,
    breakTimeHours:     user.breakTimeHours     ?? 1,
    mustChangePassword: user.mustChangePassword ?? false,
    createdAt:          user.createdAt,
    skills:             user.skills        ?? [],
    certifications:     user.certifications ?? [],
    ...(user.company ? { companyName: user.company.name, companyCode: user.company.code } : {}),
  };
};
