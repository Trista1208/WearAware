// ─── Shared domain types ──────────────────────────────────────────────────────

export type GenderType = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export type ClothingCategory =
  | 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'footwear'
  | 'accessories' | 'underwear' | 'sportswear' | 'formalwear' | 'other';

export type ClothingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'worn';

export type MaterialType =
  | 'cotton' | 'wool' | 'silk' | 'linen' | 'polyester' | 'nylon'
  | 'acrylic' | 'viscose' | 'denim' | 'leather' | 'synthetic_blend'
  | 'natural_blend' | 'other';

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';

export type DonationStatus = 'pending' | 'received' | 'listed' | 'sold' | 'unsold';

export type ScoreEventType =
  | 'wardrobe_init'
  | 'purchase_sustainable'
  | 'purchase_unsustainable'
  | 'clothing_swap'
  | 'store_donation'
  | 'high_wear_frequency'
  | 'low_wear_frequency'
  | 'manual_adjustment';

// ─── DB row shapes ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: GenderType | null;
  location_city: string | null;
  location_country: string | null;
  bio: string | null;
  style_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ClothingItem {
  id: string;
  owner_id: string;
  name: string;
  brand: string | null;
  category: ClothingCategory;
  sub_category: string | null;
  color: string | null;
  secondary_colors: string[];
  material: MaterialType | null;
  material_details: string | null;
  condition: ClothingCondition;
  purchase_year: number | null;
  purchase_price: number | null;
  image_urls: string[];
  ai_tags: string[];
  ai_style_summary: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WearLog {
  id: string;
  item_id: string;
  user_id: string;
  worn_on: string;
  occasion: string | null;
  created_at: string;
}

export interface SustainabilityScore {
  id: string;
  user_id: string;
  score: number;
  grade: string;
  updated_at: string;
}

export interface SustainabilityEvent {
  id: string;
  user_id: string;
  event_type: ScoreEventType;
  delta: number;
  score_before: number;
  score_after: number;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface ReadyToPartWith {
  id: string;
  item_id: string;
  user_id: string;
  preference: string[];
  notes: string | null;
  is_matched: boolean;
  added_at: string;
}

export interface WantedItem {
  id: string;
  user_id: string;
  category: ClothingCategory | null;
  description: string;
  preferred_brands: string[];
  preferred_colors: string[];
  size_notes: string | null;
  is_fulfilled: boolean;
  created_at: string;
}

export interface ClothingMatch {
  id: string;
  offering_item_id: string;
  wanted_item_id: string | null;
  offering_user_id: string;
  receiving_user_id: string;
  match_score: number | null;
  status: MatchStatus;
  matched_at: string;
  resolved_at: string | null;
  notes: string | null;
}

export interface UserConnection {
  id: string;
  user_a_id: string;
  user_b_id: string;
  match_id: string | null;
  connected_at: string;
}

export interface PartnerStore {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  commission_pct: number;
  is_active: boolean;
  created_at: string;
}

export interface StoreDonation {
  id: string;
  user_id: string;
  store_id: string;
  item_id: string;
  status: DonationStatus;
  listed_price: number | null;
  sold_price: number | null;
  platform_revenue: number | null;
  donated_at: string;
  sold_at: string | null;
}

export interface PurchaseAdviceLog {
  id: string;
  user_id: string;
  item_description: string | null;
  image_url: string | null;
  ai_verdict: string | null;
  ai_reasoning: string | null;
  sustainability_impact: number | null;
  user_decision: string | null;
  created_at: string;
}

// ─── API response helpers ──────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Augmented Express request ────────────────────────────────────────────────

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}
