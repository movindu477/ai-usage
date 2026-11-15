use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaWindowRow {
    pub id: Option<i64>,
    pub provider_id: String,
    pub plan_id: Option<String>,
    pub model_key: String,
    pub kind: String,
    pub label: String,
    pub used_pct: Option<f64>,
    pub resets_at_utc: Option<i64>,
    pub source: String,
    pub fetched_at_utc: i64,
    pub stale: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUsageRow {
    pub name: String,
    pub tokens: i64,
    pub cost_usd: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderPlanInfo {
    pub provider: String,
    pub name: String,
    pub accent: String,
    pub plan: String,
    pub account: Option<String>,
    pub windows: Vec<QuotaWindowRow>,
    pub models: Vec<ModelUsageRow>,
    pub fetched_at: Option<i64>,
    pub stale: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BindingWindow {
    pub label: String,
    pub used_pct: Option<f64>,
    pub resets_at: Option<i64>,
    pub stale: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricOverview {
    pub metric: String,
    pub unit: String,
    pub raw_value: f64,
    pub formatted_value: String,
    pub delta_pct: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartDataPoint {
    pub day: String,
    pub automation: i64,
    pub query: i64,
    pub system: i64,
}
