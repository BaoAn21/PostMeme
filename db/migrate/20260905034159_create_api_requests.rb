class CreateApiRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :api_requests do |t|
      t.references :collection, null: false, foreign_key: true
      t.references :folder, null: false, foreign_key: true
      t.string :name
      t.string :method
      t.string :url
      t.text :headers
      t.text :params
      t.text :body

      t.timestamps
    end
  end
end
