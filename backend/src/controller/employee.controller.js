import asyncHandler from "../utils/async-handler.js";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeAvatar,
  addSkill,
  deleteSkill,
  addCertification,
  deleteCertification,
  resetEmployeePassword,
} from "../services/employee.service.js";

export const listEmployeesController = asyncHandler(async (req, res) => {
  const result = await listEmployees(req.user.companyId);
  return res.status(result.statusCode).json(result);
});

export const getEmployeeController = asyncHandler(async (req, res) => {
  const result = await getEmployee(req.user.companyId, parseInt(req.params.id));
  return res.status(result.statusCode).json(result);
});

export const createEmployeeController = asyncHandler(async (req, res) => {
  const result = await createEmployee(req.user.companyId, req.body);
  return res.status(result.statusCode).json(result);
});

export const updateEmployeeController = asyncHandler(async (req, res) => {
  const result = await updateEmployee(
    req.user.companyId,
    parseInt(req.params.id),
    req.body,
    req.user.role,   // passed so service can restrict self-edits by EMPLOYEE
  );
  return res.status(result.statusCode).json(result);
});

export const deleteEmployeeController = asyncHandler(async (req, res) => {
  const result = await deleteEmployee(req.user.companyId, parseInt(req.params.id), req.user.id);
  return res.status(result.statusCode).json(result);
});

export const uploadAvatarController = asyncHandler(async (req, res) => {
  const result = await updateEmployeeAvatar(
    req.user.companyId,
    parseInt(req.params.id),
    req.file?.path,
  );
  return res.status(result.statusCode).json(result);
});

export const addSkillController = asyncHandler(async (req, res) => {
  const result = await addSkill(req.user.companyId, parseInt(req.params.id), req.body.name);
  return res.status(result.statusCode).json(result);
});

export const deleteSkillController = asyncHandler(async (req, res) => {
  const result = await deleteSkill(req.user.companyId, parseInt(req.params.id), parseInt(req.params.skillId));
  return res.status(result.statusCode).json(result);
});

export const addCertificationController = asyncHandler(async (req, res) => {
  const result = await addCertification(req.user.companyId, parseInt(req.params.id), req.body);
  return res.status(result.statusCode).json(result);
});

export const deleteCertificationController = asyncHandler(async (req, res) => {
  const result = await deleteCertification(req.user.companyId, parseInt(req.params.id), parseInt(req.params.certId));
  return res.status(result.statusCode).json(result);
});

export const resetEmployeePasswordController = asyncHandler(async (req, res) => {
  const result = await resetEmployeePassword(req.user.companyId, parseInt(req.params.id));
  return res.status(result.statusCode).json(result);
});
