# Executes an API request from the Rails backend, bypassing CORS entirely.
# This is the heart of PostMeme: the browser only ever talks to Rails,
# Rails talks to the target API.
class HttpExecutor
  Result = Struct.new(:status, :headers, :duration_ms, :body, :error, keyword_init: true)

  # Safety cap: don't let a huge response blow up memory
  MAX_BODY_BYTES = 10 * 1024 * 1024

  def self.execute(method:, url:, headers: [], params: [], body: nil)
    new(method:, url:, headers:, params:, body:).execute
  end

  def initialize(method:, url:, headers: [], params: [], body: nil)
    @method = method.to_s.upcase
    @url = url
    @headers = headers
    @params = params
    @body = body
  end

  def execute
    started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @response = client.request(@method.downcase.to_sym, @url,
      headers: active_headers,
      params: active_params,
      body: body_or_nil
    )
    duration = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
    return error_result(@response) if @response.is_a?(HTTPX::ErrorResponse)
    build_result(@response, duration)
  rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Errno::ETIMEDOUT => e
    Result.new(error: "Connection failed: #{e.message}")
  rescue HTTPX::TimeoutError => e
    Result.new(error: "Request timed out: #{e.message}")
  rescue HTTPX::Error => e
    Result.new(error: "HTTP error: #{e.message}")
  rescue ArgumentError => e
    Result.new(error: "Invalid request: #{e.message}")
  end

  private

  def client
    HTTPX.with(
      timeout: {
        connect_timeout: 10,
        read_timeout: 30,
        write_timeout: 30,
        operation_timeout: 120
      },
      max_redirects: 10
    ).plugin(:follow_redirects)
  end

  # ["enabled","key","value"] rows from the form
  def active_headers
    @headers.to_a.filter_map do |h|
      next unless h["enabled"] && h["key"].present?
      [h["key"], h["value"].to_s]
    end.to_h
  end

  def active_params
    @params.to_a.filter_map do |p|
      next unless p["enabled"] && p["key"].present?
      [p["key"], p["value"].to_s]
    end.to_h
  end

  def body_or_nil
    @body.present? ? @body : nil
  end

  def error_result(response)
    Result.new(error: "Request failed: #{response.error&.message}")
  end

  def build_result(response, duration)
    body = safe_body(response)
    Result.new(
      status: response.status.to_i,
      headers: normalize_headers(response.headers),
      duration_ms: (duration * 1000).round(1),
      body:
    )
  end

  def safe_body(response)
    return "" unless response.body
    raw = response.body.to_s
    raw.bytesize > MAX_BODY_BYTES ? raw.byteslice(0, MAX_BODY_BYTES) : raw
  rescue
    "(unable to read response body)"
  end

  # Headers hash {name => "value"} with duplicate headers joined
  def normalize_headers(headers)
    headers.to_a.each_with_object({}) do |(name, value), acc|
      acc[name.to_s] = value.respond_to?(:join) ? value.join(", ") : value.to_s
    end
  end
end