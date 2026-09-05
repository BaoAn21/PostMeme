# Sample data so the app doesn't feel empty on first boot.
# Run with: rails db:seed

json_placeholder = Collection.find_or_create_by!(name: "JSONPlaceholder (demo)")

login = Folder.find_or_create_by!(collection: json_placeholder, name: "Posts")

[
  {
    folder: login,
    name: "List posts",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [],
    params: [ { "enabled" => false, "key" => "_limit", "value" => "5" } ],
    body: nil
  },
  {
    folder: login,
    name: "Get post 1",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts/1",
    headers: [],
    params: [],
    body: nil
  },
  {
    folder: nil,
    name: "Create post (POST demo)",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    headers: [ { "enabled" => true, "key" => "Content-Type", "value" => "application/json" } ],
    params: [],
    body: %({"title":"PostMeme","body":"hello from my own API client","userId":1})
  }
].each do |attrs|
  folder = attrs[:folder]
  api_request = ApiRequest.find_or_initialize_by(
    collection: json_placeholder,
    folder:,
    name: attrs[:name]
  )
  api_request.update!(
    method: attrs[:method],
    url: attrs[:url],
    headers: attrs[:headers],
    params: attrs[:params],
    body: attrs[:body]
  )
end

puts "Seeded #{Collection.count} collection(s), #{ApiRequest.count} request(s)"