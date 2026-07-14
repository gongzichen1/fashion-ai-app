export type User = {
  id: string;
  name?: string;
  display_name?: string;
  avatar_url?: string;
  tenant_name?: string;
};

export type Recommendation = {
  id: string;
  type?: string;
  name: string;
  description?: string;
  color?: string;
  reason?: string;
  scenes?: string[];
  tags?: string[];
  image?: string;
};

export type Analysis = {
  id: string;
  image?: string;
  image_url?: string;
  garmentType?: string;
  garment_type?: string;
  category?: string;
  primaryColor?: string;
  colorName?: string;
  color_name?: string;
  styles?: string[];
  pattern?: string;
  material?: string;
  length?: string;
  scenes?: string[];
  suitable_scenes?: string[];
  seasons?: string[];
  suitable_seasons?: string[];
  description?: string;
  overallStyle?: string;
  styleTips?: string;
  recommendations?: Recommendation[];
  created_at?: string;
  createdAt?: string;
};

export type Preferences = {
  styles: string[];
  scenarios: string[];
  budget: string;
};

export type WardrobeItem = {
  id: string;
  name?: string;
  category?: string;
  color?: string;
  image?: string;
  image_url?: string;
  created_at?: string;
};
