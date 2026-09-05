Rails.application.routes.draw do
  root to: "collections#index"

  resources :collections, only: [:create, :destroy] do
    resources :folders, only: [:create, :destroy]
  end

  resources :api_requests, only: [:new, :create, :edit, :update, :destroy]

  post "execute", to: "executions#create"
end