class FoldersController < ApplicationController
  def create
    @collection = Collection.find(params[:collection_id])
    @folder = @collection.folders.new(folder_params)
    if @folder.save
      redirect_to root_path, notice: "Folder created"
    else
      render "collections/index", status: :unprocessable_entity
    end
  end

  def destroy
    Folder.find(params[:id]).destroy
    redirect_to root_path, notice: "Folder deleted"
  end

  private

  def folder_params = params.require(:folder).permit(:name)
end