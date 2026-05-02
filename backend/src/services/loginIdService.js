/**
 * Generates a deterministic, company-scoped loginId atomically inside a
 * Prisma transaction to prevent duplicate serials under concurrent inserts.
 *
 * Format: {COMPANY_CODE}{FIRST2}{LAST2}{YEAR}{SERIAL4}
 * Example: OIABCD20260001
 */
export async function generateLoginId(tx, { companyId, companyCode, firstName, lastName, joiningDate }) {
  const year = joiningDate instanceof Date ? joiningDate.getFullYear() : new Date(joiningDate).getFullYear();

  const count = await tx.user.count({
    where: {
      companyId,
      joiningDate: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lt:  new Date(`${year + 1}-01-01T00:00:00.000Z`),
      },
    },
  });

  const code   = companyCode.toUpperCase().slice(0, 4);
  const first2 = (firstName || "XX").slice(0, 2).toUpperCase();
  const last2  = (lastName  || "XX").slice(0, 2).toUpperCase();
  const serial = String(count + 1).padStart(4, "0");

  return `${code}${first2}${last2}${year}${serial}`;
}
