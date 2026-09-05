class Folder < ApplicationRecord
  belongs_to :collection
  has_many :api_requests, dependent: :destroy

  validates :name, presence: true
end