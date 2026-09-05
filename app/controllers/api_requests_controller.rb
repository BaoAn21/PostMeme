# Manages saved requests: create/edit/update/destroy.
# Saving happens separately from Sending — Send goes straight to ExecutionController.
class ApiRequestsController < ApplicationController
  def new
    @api_request = ApiRequest.new(
      collection: Collection.find_by(id: params[:collection_id]),
      folder: Folder.find_by(id: params[:folder_id]),
      method: "GET"
    )
    render :edit
  end

  def edit
    @api_request = ApiRequest.find(params[:id])
  end

  def create
    @api_request = ApiRequest.new(api_request_params)
    @api_request.name = @api_request.auto_name
    if @api_request.save
      redirect_to edit_api_request_path(@api_request), notice: "Request saved"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def update
    @api_request = ApiRequest.find(params[:id])
    @api_request.name = @api_request.auto_name
    if @api_request.update(api_request_params)
      respond_to do |format|
        format.turbo_stream { render :update }
        format.html { redirect_to edit_api_request_path(@api_request), notice: "Request saved" }
      end
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    ApiRequest.find(params[:id]).destroy
    redirect_to root_path, notice: "Request deleted"
  end

  private

  def api_request_params
    params.require(:api_request).permit(
      :collection_id, :folder_id, :name, :method, :url, :body,
      headers: [[:enabled, :key, :value]],
      params: [[:enabled, :key, :value]]
    )
  end
end