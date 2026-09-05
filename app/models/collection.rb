class Collection < ApplicationRecord
  has_many :folders, dependent: :destroy
  has_many :api_requests, dependent: :destroy

  validates :name, presence: true
end