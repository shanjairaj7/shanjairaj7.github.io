#!/usr/bin/env bash
set -euo pipefail

database="made-for-more-analytics"
config="analytics-worker/wrangler.toml"

run_query() {
  npx wrangler d1 execute "$database" --remote --config "$config" --command "$1"
}

echo "\n=== Made for More: funnel ==="
run_query "SELECT event_type AS step, COUNT(DISTINCT visitor_id) AS visitors FROM journey_events WHERE occurred_at >= datetime('now', '-30 days') AND event_type IN ('page_view','cta_clicked','registration_started','registration_details_saved','registration_submitted','checkout_viewed','addon_selected','paddle_checkout_opened') GROUP BY event_type ORDER BY CASE event_type WHEN 'page_view' THEN 1 WHEN 'cta_clicked' THEN 2 WHEN 'registration_started' THEN 3 WHEN 'registration_details_saved' THEN 4 WHEN 'registration_submitted' THEN 5 WHEN 'checkout_viewed' THEN 6 WHEN 'addon_selected' THEN 7 WHEN 'paddle_checkout_opened' THEN 8 END"

echo "\n=== Made for More: sections that hold attention ==="
run_query "SELECT section_id, COUNT(*) AS visits, ROUND(AVG(CAST(json_extract(payload_json, '$.duration_ms') AS REAL)) / 1000, 1) AS average_seconds, ROUND(MAX(CAST(json_extract(payload_json, '$.duration_ms') AS REAL)) / 1000, 1) AS longest_seconds FROM journey_events WHERE event_type = 'section_leave' AND occurred_at >= datetime('now', '-30 days') GROUP BY section_id ORDER BY average_seconds DESC"

echo "\n=== Made for More: saved registrations ==="
run_query "SELECT COUNT(*) AS saved_drafts, SUM(CASE WHEN registration_submitted_at IS NOT NULL THEN 1 ELSE 0 END) AS completed_step_one, SUM(CASE WHEN checkout_viewed_at IS NOT NULL THEN 1 ELSE 0 END) AS reached_checkout FROM lead_drafts WHERE updated_at >= datetime('now', '-30 days')"

echo "\n=== Made for More: verified Paddle payments ==="
run_query "SELECT currency_code, COUNT(*) AS paid_orders, SUM(CAST(amount AS INTEGER)) AS total_minor_units FROM paddle_orders WHERE status = 'completed' AND completed_at >= datetime('now', '-30 days') GROUP BY currency_code"

echo "\n=== Made for More: latest anonymous journeys ==="
run_query "SELECT session_id, visitor_id, MIN(occurred_at) AS started, MAX(occurred_at) AS last_activity, GROUP_CONCAT(DISTINCT event_type) AS actions FROM journey_events WHERE occurred_at >= datetime('now', '-30 days') GROUP BY session_id, visitor_id ORDER BY last_activity DESC LIMIT 25"
