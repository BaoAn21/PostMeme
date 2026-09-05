class CollectionsController < ApplicationController
  def index
    @collection = Collection.new
  end

  def create
    @collection = Collection.new(collection_params)
    if @collection.save
      redirect_to root_path, notice: "Collection created"
    else
      render :index, status: :unprocessable_entity
    end
  end

  def destroy
    Collection.find(params[:id]).destroy
    redirect_to root_path, notice: "Collection deleted"
  end

  private

  def collection_params = params.require(:collection).permit(:name)
end