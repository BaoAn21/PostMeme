# POST /execute — the browser posts the current request editor state here,
# Rails performs the actual API call, response comes back as JSON.
class ExecutionsController < ApplicationController
  def create
    req = params[:api_request]
    result = HttpExecutor.execute(
      method: req[:method].presence || "GET",
      url: req[:url].to_s,
      headers: parsed_rows(req[:headers]),
      params: parsed_rows(req[:params]),
      body: req[:body]
    )
    render json: result.to_h
  rescue => e
    render json: { status: nil, headers: {}, duration_ms: nil, body: nil, error: "Internal error: #{e.message}" }
  end

  private

  # Form rows arrive as hashes {enabled, key, value}; normalize to string keys.
  def parsed_rows(rows)
    Array(rows).filter_map do |r|
      next unless r.respond_to?(:[])
      { "enabled" => r[:enabled].present?, "key" => r[:key].to_s, "value" => r[:value].to_s }
    end
  rescue
    []
  end
end