class CreateFolders < ActiveRecord::Migration[8.1]
  def change
    create_table :folders do |t|
      t.references :collection, null: false, foreign_key: true
      t.string :name

      t.timestamps
    end
  end
end
