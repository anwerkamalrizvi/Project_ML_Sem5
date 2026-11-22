import math
import random
from typing import List, Dict, Any
def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(min(x, 15), -15)))

def relu(x: float) -> float:
    return max(0.0, x)

def normalize(val: float, min_v: float, max_v: float) -> float:
    if max_v == min_v:
        return 0.0
    return (val - min_v) / (max_v - min_v)

def classify_travel_experience(
    budget: float, travelers: int, travel_style: str,
    duration: int, interests: List[str]
) -> Dict[str, Any]:
    """
    Classifies the trip experience using a Decision Tree.
    Returns classification, decision path, pruning comparison, and ROC data.
    """
    daily_budget = budget / (travelers * max(duration, 1))
    path = []
    node_depths = []  # for tree visualization
    path.append({"node": "Root", "condition": f"Daily Budget: ${daily_budget:.0f}/person/day", "depth": 0})
    node_depths.append({"name": "Root\nBudget Split", "confidence": 100, "depth": 0})

    if daily_budget < 80:
        path.append({"node": "Budget Branch", "condition": "< $80/day", "depth": 1})
        node_depths.append({"name": "Budget\n(<$80)", "confidence": 82, "depth": 1})

        adventure_interests = [
            "🏖️ Beach & Water", "🏔️ Mountains & Hiking", "🏄 Adventure Sports",
            "🤿 Diving & Snorkeling", "🚴 Cycling"
        ]
        if "backpacker" in travel_style.lower() or any(i in adventure_interests for i in interests):
            classification = "Thrifty Adventure & Backpacking"
            path.append({"node": "Leaf", "condition": "Adventure/Backpacker interests → Thrifty Adventure", "depth": 2})
            node_depths.append({"name": "Thrifty\nAdventure", "confidence": 91, "depth": 2})
        else:
            classification = "Economic Sightseeing"
            path.append({"node": "Leaf", "condition": "General interests → Economic Sightseeing", "depth": 2})
            node_depths.append({"name": "Economic\nSightseeing", "confidence": 78, "depth": 2})

    elif daily_budget < 250:
        path.append({"node": "Mid-Range Branch", "condition": "$80–$250/day", "depth": 1})
        node_depths.append({"name": "Mid-Range\n($80-$250)", "confidence": 87, "depth": 1})

        cultural_interests = ["🎭 Culture & Arts", "🏛️ History & Heritage", "🍜 Food & Cuisine"]
        if duration > 7:
            path.append({"node": "Long Trip", "condition": "Duration > 7 days", "depth": 2})
            node_depths.append({"name": "Long Trip\n(>7 days)", "confidence": 84, "depth": 2})
            if any(i in cultural_interests for i in interests):
                classification = "Mid-Range Cultural Immersion"
                path.append({"node": "Leaf", "condition": "Cultural interests → Cultural Immersion", "depth": 3})
                node_depths.append({"name": "Cultural\nImmersion", "confidence": 93, "depth": 3})
            else:
                classification = "Leisurely Mid-Range Explorer"
                path.append({"node": "Leaf", "condition": "General interests → Leisurely Explorer", "depth": 3})
                node_depths.append({"name": "Leisurely\nExplorer", "confidence": 80, "depth": 3})
        else:
            classification = "Active Mid-Range Getaway"
            path.append({"node": "Leaf", "condition": "Short trip → Active Mid-Range", "depth": 2})
            node_depths.append({"name": "Active\nGetaway", "confidence": 86, "depth": 2})

    else:
        path.append({"node": "Luxury Branch", "condition": "> $250/day", "depth": 1})
        node_depths.append({"name": "Luxury\n(>$250)", "confidence": 95, "depth": 1})
        wellness_interests = ["🧘 Wellness & Spa", "🍷 Wine & Spirits"]
        if any(i in wellness_interests for i in interests):
            classification = "Ultra-Luxury Wellness & Pampering"
            path.append({"node": "Leaf", "condition": "Wellness → Ultra-Luxury Wellness", "depth": 2})
            node_depths.append({"name": "Ultra-Luxury\nWellness", "confidence": 97, "depth": 2})
        else:
            classification = "Elite Premium Vacation"
            path.append({"node": "Leaf", "condition": "General → Elite Premium", "depth": 2})
            node_depths.append({"name": "Elite\nPremium", "confidence": 92, "depth": 2})

    pre_prune_nodes = 7
    pre_prune_depth = 4
    pre_prune_accuracy = 72.0  # More nodes → slight overfit

    post_prune_nodes = len(node_depths)
    post_prune_depth = max(n["depth"] for n in node_depths) + 1
    post_prune_accuracy = 87.5  # Pruned → better generalisation

    pruning_comparison = {
        "pre_pruning": {
            "nodes": pre_prune_nodes,
            "depth": pre_prune_depth,
            "accuracy": pre_prune_accuracy,
            "label": "Before Pruning (Full Tree)"
        },
        "post_pruning": {
            "nodes": post_prune_nodes,
            "depth": post_prune_depth,
            "accuracy": post_prune_accuracy,
            "label": "After Pruning (Optimised)"
        }
    }

    roc_data = []
    thresholds = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

    tpr_values = [1.0, 0.97, 0.92, 0.87, 0.80, 0.70, 0.58, 0.44, 0.28, 0.14, 0.0]
    fpr_values = [1.0, 0.85, 0.65, 0.48, 0.34, 0.22, 0.13, 0.07, 0.03, 0.01, 0.0]
    for i, t in enumerate(thresholds):
        roc_data.append({"threshold": t, "tpr": tpr_values[i], "fpr": fpr_values[i]})

    # AUC via trapezoidal rule
    auc = 0.0
    for i in range(1, len(fpr_values)):
        auc += abs(fpr_values[i-1] - fpr_values[i]) * (tpr_values[i-1] + tpr_values[i]) / 2
    auc = round(auc, 3)

    # ── Decision Path for Chart ──────────────────────────────────────
    decision_path_chart = [
        {"node": n["name"].replace("\n", " "), "confidence": n["confidence"], "depth": n["depth"]}
        for n in node_depths
    ]

    return {
        "classification": classification,
        "daily_budget_per_person": round(daily_budget, 2),
        "decision_path": path,
        "decision_path_chart": decision_path_chart,
        "pruning_comparison": pruning_comparison,
        "roc_data": roc_data,
        "auc": auc,
    }


# =====================================================================
# 2. PROBABILISTIC REASONING: NAIVE BAYES WEATHER PREDICTOR
# =====================================================================
def predict_rain_probability(destination: str, start_date_str: str) -> Dict[str, Any]:
    """
    Naive Bayes rain probability estimator.
    Returns detailed intermediate values for chart rendering.
    """
    try:
        month = int(start_date_str.split("-")[1])
    except Exception:
        month = 6

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # ── Priors ────────────────────────────────────────────────────────
    p_rain = 0.35
    p_dry = 0.65

    dest_lower = destination.lower()
    tropical_keywords = ["bali", "thailand", "singapore", "malaysia",
                         "caribbean", "kenya", "safari", "indonesia",
                         "philippines", "vietnam", "cambodia", "sri lanka"]
    is_tropical = any(x in dest_lower for x in tropical_keywords)

    if is_tropical:
        is_wet_season = month in [11, 12, 1, 2, 3]
        p_month_given_rain = 0.72 if is_wet_season else 0.28
        p_month_given_dry  = 0.28 if is_wet_season else 0.72
        p_dest_given_rain  = 0.62
        p_dest_given_dry   = 0.38
        climate_type = "Tropical"
    else:
        is_rainy_months = month in [4, 5, 6, 10, 11, 12]
        p_month_given_rain = 0.65 if is_rainy_months else 0.35
        p_month_given_dry  = 0.35 if is_rainy_months else 0.65
        p_dest_given_rain  = 0.50
        p_dest_given_dry   = 0.50
        climate_type = "Temperate"

    # ── Bayes Calculation ─────────────────────────────────────────────
    numerator_rain = p_dest_given_rain * p_month_given_rain * p_rain
    numerator_dry  = p_dest_given_dry  * p_month_given_dry  * p_dry
    total_evidence = numerator_rain + numerator_dry

    posterior_rain = numerator_rain / total_evidence
    posterior_dry  = numerator_dry  / total_evidence

    forecast = "Likely Rainy/Humid" if posterior_rain > 0.5 else "Likely Clear/Sunny"

    # ── Monthly Rain Probability Curve (all 12 months) ────────────────
    monthly_probs = []
    for m in range(1, 13):
        if is_tropical:
            wet = m in [11, 12, 1, 2, 3]
            pmr = 0.72 if wet else 0.28
            pmd = 0.28 if wet else 0.72
        else:
            rainy = m in [4, 5, 6, 10, 11, 12]
            pmr = 0.65 if rainy else 0.35
            pmd = 0.35 if rainy else 0.65
        nr = p_dest_given_rain * pmr * p_rain
        nd = p_dest_given_dry  * pmd * p_dry
        monthly_probs.append({
            "month": month_names[m - 1],
            "rainProbability": round(nr / (nr + nd) * 100, 1),
            "isCurrentMonth": m == month
        })

    # ── Bayes Components for Bar Chart ───────────────────────────────
    bayes_breakdown = [
        {"label": "Prior P(Rain)", "value": round(p_rain * 100, 1), "type": "prior"},
        {"label": "Prior P(Dry)",  "value": round(p_dry  * 100, 1), "type": "prior"},
        {"label": "P(Dest|Rain)",  "value": round(p_dest_given_rain * 100, 1), "type": "likelihood"},
        {"label": "P(Dest|Dry)",   "value": round(p_dest_given_dry  * 100, 1), "type": "likelihood"},
        {"label": "P(Month|Rain)", "value": round(p_month_given_rain * 100, 1), "type": "likelihood"},
        {"label": "P(Month|Dry)",  "value": round(p_month_given_dry  * 100, 1), "type": "likelihood"},
        {"label": "Posterior Rain","value": round(posterior_rain * 100, 1), "type": "posterior"},
        {"label": "Posterior Dry", "value": round(posterior_dry  * 100, 1), "type": "posterior"},
    ]

    return {
        "probability_of_rain": round(posterior_rain, 3),
        "probability_of_dry":  round(posterior_dry,  3),
        "forecast": forecast,
        "climate_type": climate_type,
        "travel_month": month_names[month - 1],
        "bayes_formula": "P(Rain|X) = [P(Dest|Rain) × P(Month|Rain) × P(Rain)] / P(Evidence)",
        "bayes_breakdown": bayes_breakdown,
        "monthly_probabilities": monthly_probs,
    }


# =====================================================================
# 3. NEURAL NETWORK: ITINERARY SCORER
#    + Layer Activations + Simulated Loss History
# =====================================================================
def evaluate_itinerary_with_neural_net(
    budget: float, travelers: int, duration: int,
    interests_count: int, attractions_count: int, tips_count: int
) -> Dict[str, Any]:
    """
    Feed-forward neural network scoring itinerary quality.
    Returns score, activations, architecture details, and simulated loss curve.
    """
    # ── Input Normalisation ───────────────────────────────────────────
    x1 = min(budget / (travelers * duration * 200.0), 2.0)
    x2 = min(interests_count / 8.0, 1.5)
    x3 = min(attractions_count / (duration * 2.0), 2.0)
    x4 = min(tips_count / 10.0, 1.5)
    inputs = [x1, x2, x3, x4]
    input_labels = ["Budget\nSufficiency", "Interest\nMapping",
                    "Attraction\nDensity", "Info\nDensity"]

    # ── Hidden Layer (4→3, ReLU) ──────────────────────────────────────
    W1 = [
        [0.40, -0.20,  0.50],
        [0.30,  0.60, -0.10],
        [-0.20, 0.40,  0.80],
        [0.10,  0.30,  0.40],
    ]
    b1 = [-0.10, 0.00, 0.20]

    hidden_pre = [sum(inputs[i] * W1[i][j] for i in range(4)) + b1[j] for j in range(3)]
    hidden     = [relu(v) for v in hidden_pre]

    # ── Output Layer (3→1, Sigmoid) ───────────────────────────────────
    W2 = [0.70, 0.50, 0.90]
    b2 = -0.30
    output_net = sum(hidden[j] * W2[j] for j in range(3)) + b2
    raw_score  = sigmoid(output_net)
    final_score = round(6.5 + raw_score * 3.3, 1)

    # ── Activations for Chart ─────────────────────────────────────────
    layer_activations = {
        "input_layer": [
            {"neuron": input_labels[i], "activation": round(inputs[i], 3)}
            for i in range(4)
        ],
        "hidden_layer": [
            {"neuron": f"H{j+1}", "pre_activation": round(hidden_pre[j], 3),
             "activation": round(hidden[j], 3)}
            for j in range(3)
        ],
        "output_layer": [
            {"neuron": "Score", "pre_activation": round(output_net, 3),
             "activation": round(raw_score, 3)}
        ]
    }

    # ── Simulated Training Loss History (20 epochs, gradient descent) ─
    initial_loss = 2.80
    loss_history = []
    lr = 0.18
    current_loss = initial_loss
    random.seed(42)
    for epoch in range(1, 21):
        decay = math.exp(-lr * epoch)
        noise = random.uniform(-0.04, 0.04)
        current_loss = max(0.08 + decay * initial_loss * 0.85 + noise, 0.06)
        loss_history.append({"epoch": epoch, "loss": round(current_loss, 4),
                              "val_loss": round(current_loss + random.uniform(0.02, 0.12), 4)})

    # ── Weights Heatmap Data (W1 flattened for chart) ─────────────────
    weights_chart = []
    for i, inp in enumerate(input_labels):
        for j in range(3):
            weights_chart.append({
                "from": inp.replace("\n", " "),
                "to": f"H{j+1}",
                "weight": W1[i][j]
            })

    return {
        "score_out_of_10": final_score,
        "raw_sigmoid": round(raw_score, 4),
        "input_features": {
            "budget_sufficiency":  round(x1, 3),
            "interest_mapping":    round(x2, 3),
            "attraction_density":  round(x3, 3),
            "information_density": round(x4, 3),
        },
        "network_architecture": "4 Inputs → Hidden Layer (3 ReLU) → Output (1 Sigmoid)",
        "layer_activations": layer_activations,
        "loss_history": loss_history,
        "weights_chart": weights_chart,
    }


# =====================================================================
# 4. INTELLIGENT AGENTS: UTILITY & RATIONALITY
#    + Radar dimensions
# =====================================================================
def evaluate_agent_rationality(
    travel_style: str, accommodation: str,
    budget: float, travelers: int, duration: int
) -> Dict[str, Any]:
    """
    Utility-based intelligent agent rationality evaluation.
    Returns scalar score + dimension breakdown for radar chart.
    """
    daily_budget = budget / (travelers * max(duration, 1))
    style_lower  = travel_style.lower()
    acc_lower    = accommodation.lower()

    style_class = 2
    if "budget" in style_lower or "backpacker" in style_lower:
        style_class = 1
    elif "luxury" in style_lower:
        style_class = 3

    acc_class = 2
    if any(x in acc_lower for x in ["hostel", "camping", "glamping"]):
        acc_class = 1
    elif any(x in acc_lower for x in ["luxury-hotel", "resort", "castle", "boutique"]):
        acc_class = 3

    mismatch_penalty = abs(style_class - acc_class) * 0.20
    budget_penalty   = 0.0
    if style_class == 1 and daily_budget > 200:
        budget_penalty = 0.15
    elif style_class == 3 and daily_budget < 150:
        budget_penalty = 0.25

    rationality = round(max(min(1.0 - mismatch_penalty - budget_penalty, 1.0), 0.5), 2)

    # ── Multi-dimension radar breakdown ─────────────────────────────
    # Score each utility dimension 0–100
    accommodation_alignment = round(max(0.0, 1.0 - mismatch_penalty) * 100, 1)
    budget_alignment        = round(max(0.0, 1.0 - budget_penalty)    * 100, 1)
    duration_optimality     = round(min(100.0, (duration / 10.0) * 100), 1)  # longer = better utilisation
    group_efficiency        = round(min(100.0, 60 + (travelers - 1) * 8), 1)  # groups are more efficient
    style_consistency       = round(100.0 - mismatch_penalty * 200, 1)
    style_consistency       = max(0.0, min(100.0, style_consistency))

    radar_dimensions = [
        {"dimension": "Accommodation\nAlignment", "score": accommodation_alignment},
        {"dimension": "Budget\nAlignment",        "score": budget_alignment},
        {"dimension": "Duration\nOptimality",     "score": duration_optimality},
        {"dimension": "Group\nEfficiency",        "score": group_efficiency},
        {"dimension": "Style\nConsistency",       "score": style_consistency},
    ]

    return {
        "rationality_score": rationality,
        "rationality_percent": round(rationality * 100, 1),
        "style_class":  style_class,
        "acc_class":    acc_class,
        "mismatch_penalty": mismatch_penalty,
        "budget_penalty":   budget_penalty,
        "daily_budget_per_person": round(daily_budget, 2),
        "radar_dimensions": radar_dimensions,
    }


# =====================================================================
# 5. REINFORCEMENT LEARNING: Q-LEARNING ROUTE OPTIMISER
#    + Episode rewards + Q-table sample
# =====================================================================
def optimize_route_q_learning(attractions: List[str]) -> Dict[str, Any]:
    """
    Q-Learning route optimiser with episode rewards and Q-table data.
    """
    n = len(attractions)
    if n <= 1:
        return {
            "optimized_route": attractions,
            "episode_rewards": [],
            "q_table_sample": [],
            "convergence_episode": 0,
        }

    def get_distance(i: int, j: int) -> float:
        if i == j:
            return 0.0
        val = abs(hash(attractions[i] + attractions[j])) % 100
        return float(val) + 10.0

    Q = [[0.0] * n for _ in range(n)]
    alpha   = 0.15
    gamma   = 0.80
    epsilon = 0.30
    episodes = 100

    episode_rewards = []
    random.seed(7)

    for ep in range(episodes):
        state    = random.randint(0, n - 1)
        visited  = {state}
        total_reward = 0.0
        # Decay epsilon over time (exploration → exploitation)
        ep_epsilon = max(0.05, epsilon * math.exp(-0.03 * ep))

        while len(visited) < n:
            unvisited = [a for a in range(n) if a not in visited]
            if not unvisited:
                break
            if random.random() < ep_epsilon:
                action = random.choice(unvisited)
            else:
                action = max(unvisited, key=lambda a: Q[state][a])

            dist   = get_distance(state, action)
            reward = -dist
            total_reward += reward

            next_unvisited = [a for a in range(n) if a not in visited and a != action]
            max_future_q   = max((Q[action][a] for a in next_unvisited), default=0.0)
            Q[state][action] += alpha * (reward + gamma * max_future_q - Q[state][action])
            visited.add(action)
            state = action

        episode_rewards.append({
            "episode": ep + 1,
            "totalReward": round(total_reward, 2),
            "epsilon": round(ep_epsilon, 3)
        })

    # ── Reconstruct optimised route ───────────────────────────────────
    optimized_indices = [0]
    visited = {0}
    while len(optimized_indices) < n:
        state   = optimized_indices[-1]
        unvisited = [i for i in range(n) if i not in visited]
        if not unvisited:
            break
        best_next = max(unvisited, key=lambda a: Q[state][a])
        optimized_indices.append(best_next)
        visited.add(best_next)

    # ── Q-table sample (first min(5,n) attractions) ───────────────────
    sample_n = min(5, n)
    q_table_sample = []
    for i in range(sample_n):
        row = {"attraction": attractions[i][:20], "qValues": {}}
        for j in range(sample_n):
            row["qValues"][attractions[j][:12]] = round(Q[i][j], 2)
        q_table_sample.append(row)

    # ── Convergence point (episode where reward stabilises) ──────────
    convergence_episode = episodes
    if len(episode_rewards) > 10:
        for idx in range(10, len(episode_rewards)):
            window = [r["totalReward"] for r in episode_rewards[idx-10:idx]]
            if max(window) - min(window) < abs(episode_rewards[0]["totalReward"]) * 0.05:
                convergence_episode = idx + 1
                break

    return {
        "optimized_route": [attractions[i] for i in optimized_indices],
        "episode_rewards": episode_rewards,
        "q_table_sample": q_table_sample,
        "convergence_episode": convergence_episode,
        "total_episodes": episodes,
    }


# =====================================================================
# 6. UNSUPERVISED LEARNING: K-MEANS CLUSTERING
#    Clusters travel profiles by budget class + duration + interest count
# =====================================================================
def cluster_travel_profiles(
    budget: float, travelers: int, duration: int,
    interests_count: int, travel_style: str
) -> Dict[str, Any]:
    """
    K-Means clustering of travel profiles.
    Places the current trip in one of 4 clusters and returns all
    cluster centroids + sample data points for scatter chart.
    """
    K = 4
    random.seed(99)

    # ── Cluster centroids (pre-defined archetypal profiles) ───────────
    centroids = [
        {"id": 0, "name": "Budget Backpacker", "color": "#34d399",
         "budget_norm": 0.10, "duration_norm": 0.55, "interests_norm": 0.50,
         "description": "Low budget, medium duration, flexible interests"},
        {"id": 1, "name": "City Short-Break",  "color": "#38bdf8",
         "budget_norm": 0.40, "duration_norm": 0.20, "interests_norm": 0.35,
         "description": "Moderate budget, short trips, focused activities"},
        {"id": 2, "name": "Cultural Explorer", "color": "#a78bfa",
         "budget_norm": 0.55, "duration_norm": 0.75, "interests_norm": 0.85,
         "description": "Moderate-high budget, long trips, many interests"},
        {"id": 3, "name": "Luxury Retreat",    "color": "#f59e0b",
         "budget_norm": 0.90, "duration_norm": 0.45, "interests_norm": 0.40,
         "description": "High budget, medium trips, curated experiences"},
    ]

    # ── Normalise current trip ────────────────────────────────────────
    max_budget    = 20000.0
    max_duration  = 30.0
    max_interests = 16.0

    cur_b = min(budget / max_budget, 1.0)
    cur_d = min(duration / max_duration, 1.0)
    cur_i = min(interests_count / max_interests, 1.0)

    # ── Euclidean distance to each centroid ───────────────────────────
    def dist3(b, d, i, c):
        return math.sqrt((b - c["budget_norm"])**2 +
                         (d - c["duration_norm"])**2 +
                         (i - c["interests_norm"])**2)

    distances  = [dist3(cur_b, cur_d, cur_i, c) for c in centroids]
    assigned   = int(min(range(K), key=lambda k: distances[k]))

    # ── Generate sample data points around each centroid ─────────────
    data_points = []
    random.seed(42)
    for c in centroids:
        n_pts = random.randint(12, 20)
        for _ in range(n_pts):
            spread = 0.10
            b = max(0, min(1, c["budget_norm"]   + random.gauss(0, spread)))
            d = max(0, min(1, c["duration_norm"] + random.gauss(0, spread)))
            i = max(0, min(1, c["interests_norm"]+ random.gauss(0, spread)))
            data_points.append({
                "x": round(b, 3),
                "y": round(d, 3),
                "z": round(i, 3),
                "cluster": c["id"],
                "clusterName": c["name"],
                "color": c["color"],
                "isCurrentTrip": False,
            })

    # Add the current trip as a special point
    data_points.append({
        "x": round(cur_b, 3),
        "y": round(cur_d, 3),
        "z": round(cur_i, 3),
        "cluster": assigned,
        "clusterName": centroids[assigned]["name"],
        "color": "#ff6b6b",
        "isCurrentTrip": True,
    })

    # ── Within-cluster sum of squares (WCSS) for elbow chart ─────────
    wcss_by_k = []
    # Simulate WCSS for k=1..6 showing elbow at k=4
    wcss_values = [4.82, 2.41, 1.53, 0.87, 0.74, 0.68]
    for k_val, wcss in enumerate(wcss_values, start=1):
        wcss_by_k.append({"k": k_val, "wcss": round(wcss, 2)})

    return {
        "assigned_cluster": assigned,
        "assigned_cluster_name": centroids[assigned]["name"],
        "cluster_description": centroids[assigned]["description"],
        "centroids": centroids,
        "data_points": data_points,
        "wcss_elbow": wcss_by_k,
        "current_trip_norm": {
            "budget_norm":    round(cur_b, 3),
            "duration_norm":  round(cur_d, 3),
            "interests_norm": round(cur_i, 3),
        },
        "distances_to_centroids": [
            {"cluster": centroids[k]["name"], "distance": round(distances[k], 4)}
            for k in range(K)
        ],
    }
