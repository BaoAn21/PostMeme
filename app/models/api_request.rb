class ApiRequest < ApplicationRecord
  HTTP_METHODS = %w[GET POST PUT PATCH DELETE HEAD OPTIONS].freeze

  belongs_to :collection
  belongs_to :folder, optional: true

  serialize :headers, coder: JSON, type: Array, default: []
  serialize :params, coder: JSON, type: Array, default: []

  validates :method, inclusion: { in: HTTP_METHODS }
  validates :url, presence: true, format: { with: %r{\Ahttps?://}i, message: "must start with http:// or https://" }
  validate :collection_root_or_folder

  # rows: {"enabled" => bool, "key" => ..., "value" => ...}
  def enabled_headers = (headers || []).select { |h| h["enabled"] }
  def enabled_params  = (params  || []).select { |p| p["enabled"] }

  # Auto-name from URL when the user didn't type a name
  def auto_name
    return name if name.present?
    return url if url.blank?
    uri = URI.parse(url)
    [uri.host, uri.path].reject(&:blank?).join(" ").presence || uri.to_s
  rescue URI::InvalidURIError
    url
  end

  private

  # A request must live either at the collection root or in a folder
  def collection_root_or_folder
    if folder.nil?
      errors.add(:base, "A request needs a collection") if collection.nil?
    elsif folder.collection_id != collection_id
      errors.add(:folder, "must belong to the same collection")
    end
  end
end