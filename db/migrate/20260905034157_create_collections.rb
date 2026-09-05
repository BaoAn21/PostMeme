class CreateCollections < ActiveRecord::Migration[8.1]
  def change
    create_table :collections do |t|
      t.string :name

      t.timestamps
    end
  end
end
