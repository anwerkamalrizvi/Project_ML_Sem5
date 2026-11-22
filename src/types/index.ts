export interface TripPreferences {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  currency: string;
  interests: string[];
  travelStyle: string;
  accommodationType: string;
  dietaryRestrictions: string;
  mobilityNeeds: string;
  specialRequests: string;
  /** Which AI model to use: 'gemini' (default) | 'claude' */
  aiModel?: 'gemini' | 'claude';
}

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  food: number;
  activities: number;
  transportation: number;
  shopping: number;
  emergencyFund: number;
  total: number;
  perPerson: number;
  currency: string;
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  estimatedCost: number;
  tips: string[];
}

export interface Attraction {
  name: string;
  type: string;
  description: string;
  entryFee: string;
  bestTime: string;
  rating: number;
  mustSee: boolean;
  address?: string;
}

export interface Threat {
  category: string;
  level: 'Low' | 'Medium' | 'High';
  description: string;
  precautions: string[];
  icon: string;
}

export interface TravelRequirement {
  category: string;
  items: string[];
  icon: string;
}

// ── AI Insights ────────────────────────────────────────────────────────

export interface DecisionPathNode {
  node: string;
  condition: string;
  depth: number;
}

export interface DecisionPathChartNode {
  node: string;
  confidence: number;
  depth: number;
}

export interface PruningData {
  nodes: number;
  depth: number;
  accuracy: number;
  label: string;
}

export interface ROCPoint {
  threshold: number;
  tpr: number;
  fpr: number;
}

export interface ClassificationInsight {
  classification: string;
  daily_budget_per_person: number;
  decision_path: DecisionPathNode[];
  decision_path_chart: DecisionPathChartNode[];
  pruning_comparison: {
    pre_pruning: PruningData;
    post_pruning: PruningData;
  };
  roc_data: ROCPoint[];
  auc: number;
}

export interface BayesBreakdownItem {
  label: string;
  value: number;
  type: 'prior' | 'likelihood' | 'posterior';
}

export interface MonthlyProbability {
  month: string;
  rainProbability: number;
  isCurrentMonth: boolean;
}

export interface WeatherInsight {
  probability_of_rain: number;
  probability_of_dry: number;
  forecast: string;
  climate_type: string;
  travel_month: string;
  bayes_formula: string;
  bayes_breakdown: BayesBreakdownItem[];
  monthly_probabilities: MonthlyProbability[];
}

export interface NeuronActivation {
  neuron: string;
  activation: number;
  pre_activation?: number;
}

export interface LossPoint {
  epoch: number;
  loss: number;
  val_loss: number;
}

export interface WeightEdge {
  from: string;
  to: string;
  weight: number;
}

export interface NeuralNetInsight {
  score_out_of_10: number;
  raw_sigmoid: number;
  input_features: {
    budget_sufficiency: number;
    interest_mapping: number;
    attraction_density: number;
    information_density: number;
  };
  network_architecture: string;
  layer_activations: {
    input_layer: NeuronActivation[];
    hidden_layer: NeuronActivation[];
    output_layer: NeuronActivation[];
  };
  loss_history: LossPoint[];
  weights_chart: WeightEdge[];
}

export interface RadarDimension {
  dimension: string;
  score: number;
}

export interface AgentRationalityInsight {
  rationality_score: number;
  rationality_percent: number;
  style_class: number;
  acc_class: number;
  mismatch_penalty: number;
  budget_penalty: number;
  daily_budget_per_person: number;
  radar_dimensions: RadarDimension[];
}

export interface EpisodeReward {
  episode: number;
  totalReward: number;
  epsilon: number;
}

export interface QTableRow {
  attraction: string;
  qValues: Record<string, number>;
}

export interface RLRouteInsight {
  optimized_route: string[];
  episode_rewards: EpisodeReward[];
  q_table_sample: QTableRow[];
  convergence_episode: number;
  total_episodes: number;
}

export interface ClusterPoint {
  x: number;
  y: number;
  z: number;
  cluster: number;
  clusterName: string;
  color: string;
  isCurrentTrip: boolean;
}

export interface ClusterCentroid {
  id: number;
  name: string;
  color: string;
  budget_norm: number;
  duration_norm: number;
  interests_norm: number;
  description: string;
}

export interface WCSSPoint {
  k: number;
  wcss: number;
}

export interface ClusteringInsight {
  assigned_cluster: number;
  assigned_cluster_name: string;
  cluster_description: string;
  centroids: ClusterCentroid[];
  data_points: ClusterPoint[];
  wcss_elbow: WCSSPoint[];
  current_trip_norm: {
    budget_norm: number;
    duration_norm: number;
    interests_norm: number;
  };
  distances_to_centroids: { cluster: string; distance: number }[];
}

export interface AIInsights {
  classification: ClassificationInsight;
  weather_probability: WeatherInsight;
  itinerary_score: NeuralNetInsight;
  agent_rationality: AgentRationalityInsight;
  rl_route: RLRouteInsight;
  clustering: ClusteringInsight;
}

// ── Main Types ────────────────────────────────────────────────────────

export interface TripPlan {
  destination: string;
  overview: string;
  bestTimeToVisit: string;
  weatherInfo: string;
  localCurrency: string;
  language: string;
  timezone: string;
  budget: BudgetBreakdown;
  itinerary: DayPlan[];
  attractions: Attraction[];
  threats: Threat[];
  requirements: TravelRequirement[];
  packingList: string[];
  localTips: string[];
  emergencyContacts: { name: string; number: string }[];
  nearbyDestinations: string[];
  sustainabilityTips: string[];
  ai_insights?: AIInsights;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface SavedTrip {
  id: string;
  preferences: TripPreferences;
  plan: TripPlan;
  createdAt: string;
}

export type AppPage =
  | 'home'
  | 'planner'
  | 'results'
  | 'chat'
  | 'saved'
  | 'auth'
  | 'pricing'
  | 'payment-success'
  | 'payment-cancel';

export type BackendStatus = 'checking' | 'online' | 'offline';

// ── Credit / Payment ─────────────────────────────────────────────────
export interface CreditPackage {
  id:      string;
  credits: number;
  price:   number;   // USD
  label:   string;
}
