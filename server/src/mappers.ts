/**
 * Conversão entre as linhas do PostgreSQL (snake_case) e o formato que o
 * frontend já consome (camelCase), mantendo os contratos existentes.
 */

export interface JobRow {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  description: string;
  location: string;
  modality: string;
  level: string;
  area: string;
  accessibility_features: string[];
  status: string;
  created_at: Date;
  published_at: Date | null;
}

export function toJob(row: JobRow) {
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
    accessibilityFeatures: row.accessibility_features ?? [],
    status: row.status,
    createdAt: iso(row.created_at),
    publishedAt: row.published_at ? iso(row.published_at) : undefined,
  };
}

export function toUser(row: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: iso(row.created_at),
  };
}

export function toApplication(row: {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  candidate_id: string;
  status: string;
  shared_accommodations: string[] | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    companyName: row.company_name,
    candidateId: row.candidate_id,
    status: row.status,
    // NF2: ausente quando o candidato não autorizou o compartilhamento
    sharedAccommodations: row.shared_accommodations ?? undefined,
    createdAt: iso(row.created_at),
  };
}

export function toCompany(row: {
  user_id: string;
  name: string;
  cnpj: string;
  sector: string;
  description: string;
  inclusion_policy: string;
  accessibility_features: string[];
  website: string | null;
  verification_status: string;
  updated_at: Date;
}) {
  return {
    userId: row.user_id,
    name: row.name,
    cnpj: row.cnpj,
    sector: row.sector,
    description: row.description,
    inclusionPolicy: row.inclusion_policy,
    accessibilityFeatures: row.accessibility_features ?? [],
    website: row.website ?? "",
    verificationStatus: row.verification_status,
    updatedAt: iso(row.updated_at),
  };
}

export function toReport(row: {
  id: string;
  target_type: string;
  target_id: string;
  target_label: string;
  reporter_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: Date;
}) {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    reporterId: row.reporter_id ?? "",
    reason: row.reason,
    details: row.details ?? undefined,
    status: row.status,
    createdAt: iso(row.created_at),
  };
}

export function toModerationAction(row: {
  id: string;
  admin_id: string | null;
  admin_name: string;
  target_type: string;
  target_id: string;
  target_label: string;
  action: string;
  reason: string | null;
  created_at: Date;
}) {
  return {
    id: row.id,
    adminId: row.admin_id ?? "",
    adminName: row.admin_name,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    action: row.action,
    reason: row.reason ?? undefined,
    createdAt: iso(row.created_at),
  };
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}
