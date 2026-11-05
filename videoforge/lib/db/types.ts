/** Row types mirroring supabase/migrations. Keep in sync with the SQL schema. */

export type OrgRole = "admin" | "member";
export type AccountStatus = "active" | "suspended" | "blocked";
export type VideoStatus = "draft" | "queued" | "processing" | "succeeded" | "failed";
export type GenerationMode = "text_to_video" | "image_to_video";
export type JobStatus = "submitting" | "submitted" | "processing" | "succeeded" | "failed" | "timed_out";
export type CreditTxType =
  | "signup_bonus"
  | "purchase"
  | "subscription_grant"
  | "generation"
  | "refund"
  | "admin_adjustment";
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export const VIDEO_STATUSES: readonly VideoStatus[] = ["draft", "queued", "processing", "succeeded", "failed"];
export const ACTIVE_VIDEO_STATUSES: readonly VideoStatus[] = ["draft", "queued", "processing"];

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  locale: "sl" | "en";
  status: AccountStatus;
  status_reason: string | null;
  is_platform_admin: boolean;
  active_organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  name: string;
  owner_id: string | null;
  is_personal: boolean;
  credit_balance: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  updated_at: string;
};

export type VideoRow = {
  id: string;
  organization_id: string;
  user_id: string;
  mode: GenerationMode;
  status: VideoStatus;
  provider: "kling";
  model: string;
  resolution: "720p" | "1080p" | "4k";
  duration_seconds: 5 | 10;
  aspect_ratio: "16:9" | "9:16" | "1:1";
  audio: boolean;
  prompt: string;
  negative_prompt: string | null;
  template_id: string | null;
  source_image_path: string | null;
  video_storage_path: string | null;
  provider_video_id: string | null;
  provider_video_url: string | null;
  result_duration_seconds: number | null;
  credits_cost: number;
  credits_charged: number;
  credits_refunded: number;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  submitted_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoJobRow = {
  id: string;
  video_id: string;
  organization_id: string;
  user_id: string;
  provider: "kling";
  task_type: "text-to-video" | "image-to-video";
  model: string;
  external_task_id: string;
  provider_task_id: string | null;
  status: JobStatus;
  provider_status: string | null;
  provider_status_message: string | null;
  submit_attempts: number;
  poll_count: number;
  last_polled_at: string | null;
  next_poll_at: string | null;
  locked_until: string | null;
  estimated_provider_units: number | null;
  provider_units: number | null;
  provider_cost_usd: number | null;
  provider_billing: unknown;
  error_code: string | null;
  error_message: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreditTransactionRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  video_id: string | null;
  type: CreditTxType;
  amount: number;
  balance_after: number;
  description: string | null;
  idempotency_key: string | null;
  stripe_reference: string | null;
  amount_paid_cents: number | null;
  currency: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  organization_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string | null;
  plan_id: string;
  status: SubscriptionStatus;
  monthly_credits: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiUsageLogInsert = {
  organization_id?: string | null;
  user_id?: string | null;
  video_id?: string | null;
  video_job_id?: string | null;
  provider?: "kling";
  operation:
    | "create_text_to_video"
    | "create_image_to_video"
    | "get_task"
    | "get_task_by_external_id"
    | "download_video";
  http_status?: number | null;
  provider_code?: number | null;
  provider_request_id?: string | null;
  success: boolean;
  error_category?: string | null;
  latency_ms?: number | null;
  attempt?: number;
  provider_units?: number | null;
  cost_usd?: number | null;
};
