export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  current_password?: string;
}

export interface UpdateProfileResponse {
  id: number;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

export interface ChangePasswordRequest {
  current_password?: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: true;
}

export interface UpdateAvatarResponse {
  avatar_url: string;
}

export interface NotificationPreferencesRequest {
  reservations_email?: boolean;
  reservations_push?: boolean;
  payments_email?: boolean;
  payments_push?: boolean;
  messages_email?: boolean;
  messages_push?: boolean;
  marketing_email?: boolean;
  marketing_push?: boolean;
}

export interface NotificationPreferencesResponse {
  user_id: number;
  reservations_email: boolean;
  reservations_push: boolean;
  payments_email: boolean;
  payments_push: boolean;
  messages_email: boolean;
  messages_push: boolean;
  marketing_email: boolean;
  marketing_push: boolean;
  created_at?: Date;
  updated_at?: Date;
}
