import { decryptSensitive } from "./crypto.js";

/** Converte uma linha de `users` no objeto User público (sem hash). */
export function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toCompany(row) {
  return {
    userId: row.user_id,
    name: row.name,
    cnpj: row.cnpj,
    sector: row.sector,
    description: row.description,
    inclusionPolicy: row.inclusion_policy,
    accessibilityFeatures: JSON.parse(row.accessibility_features || "[]"),
    website: row.website,
    verificationStatus: row.verification_status,
    updatedAt: row.updated_at,
  };
}

export function toProfile(row) {
  return {
    userId: row.user_id,
    headline: row.headline,
    bio: row.bio,
    skills: JSON.parse(row.skills || "[]"),
    experience: row.experience,
    education: row.education,
    salaryExpectation: row.salary_expectation,
    visibility: row.visibility,
    resume: row.resume ? JSON.parse(row.resume) : undefined,
    sensitive: decryptSensitive(row.sensitive_enc),
    updatedAt: row.updated_at,
  };
}

export function toJob(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    title: row.title,
    description: row.description,
    location: row.location,
    modality: row.modality,
    level: row.level,
    area: row.area,
    accessibilityFeatures: JSON.parse(row.accessibility_features || "[]"),
    status: row.status,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined,
  };
}

export function toApplication(row) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    candidateId: row.candidate_id,
    status: row.status,
    sharedAccommodations: row.shared_accommodations
      ? JSON.parse(row.shared_accommodations)
      : undefined,
    createdAt: row.created_at,
  };
}

export function toFavorite(row) {
  return {
    jobId: row.job_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    savedAt: row.saved_at,
  };
}

export function toAlert(row) {
  return {
    id: row.id,
    keyword: row.keyword ?? undefined,
    area: row.area ?? undefined,
    createdAt: row.created_at,
  };
}

export function toReport(row) {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    reporterId: row.reporter_id,
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toAudit(row) {
  return {
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    action: row.action,
    reason: row.reason ?? undefined,
    createdAt: row.created_at,
  };
}
