class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # The sidebar renders the collection tree on every page
  before_action :load_collections

  private

  def load_collections
    @collections = Collection.includes(:folders).order(:name)
  end
end