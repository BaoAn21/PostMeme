class MakeFolderIdNullableOnApiRequests < ActiveRecord::Migration[8.1]
  def change
    change_column_null :api_requests, :folder_id, true
  end
end