// Parses a curl command line into { method, url, headers, params, body }.
// Not a full shell parser — handles the flags people actually paste from
// browser devtools / API docs: -X, -H, -d/--data*, -u, -b, -A, -e, -G, --url.

const FLAGS_WITH_ARG = new Set([
  "-X", "--request",
  "-H", "--header",
  "-d", "--data", "--data-raw", "--data-ascii", "--data-binary", "--data-urlencode",
  "-u", "--user",
  "-b", "--cookie",
  "-A", "--user-agent",
  "-e", "--referer",
  "--url",
  "-F", "--form",
  "-o", "--output"
])

function tokenize(str) {
  const tokens = []
  let i = 0
  const n = str.length

  while (i < n) {
    while (i < n && /\s/.test(str[i])) i++
    if (i >= n) break

    let token = ""
    while (i < n && !/\s/.test(str[i])) {
      const c = str[i]
      if (c === "'") {
        i++
        while (i < n && str[i] !== "'") { token += str[i]; i++ }
        i++
      } else if (c === '"') {
        i++
        while (i < n && str[i] !== '"') {
          if (str[i] === "\\" && i + 1 < n && '"\\$`'.includes(str[i + 1])) {
            token += str[i + 1]
            i += 2
          } else {
            token += str[i]
            i++
          }
        }
        i++
      } else if (c === "\\") {
        token += str[i + 1] ?? ""
        i += 2
      } else {
        token += c
        i++
      }
    }
    tokens.push(token)
  }
  return tokens
}

export function parseCurl(input) {
  const joined = input.trim().replace(/\\\r?\n/g, " ")
  const tokens = tokenize(joined)
  if (tokens[0]?.toLowerCase() === "curl") tokens.shift()

  let url = null
  let method = null
  let user = null
  let isGet = false
  const headers = []
  const dataParts = []

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    const next = () => tokens[++i]

    if (!FLAGS_WITH_ARG.has(t) && !["-G", "--get"].includes(t) && t.startsWith("-")) {
      continue // unrecognized no-arg flag (-k, --compressed, -L, -s, -v, ...): ignore
    }

    switch (t) {
      case "-X":
      case "--request":
        method = (next() || "").toUpperCase()
        break
      case "-H":
      case "--header": {
        const h = next() || ""
        const idx = h.indexOf(":")
        if (idx > -1) headers.push({ enabled: true, key: h.slice(0, idx).trim(), value: h.slice(idx + 1).trim() })
        break
      }
      case "-d":
      case "--data":
      case "--data-raw":
      case "--data-ascii":
      case "--data-binary":
      case "--data-urlencode":
        dataParts.push(next() || "")
        break
      case "-u":
      case "--user":
        user = next()
        break
      case "-b":
      case "--cookie":
        headers.push({ enabled: true, key: "Cookie", value: next() || "" })
        break
      case "-A":
      case "--user-agent":
        headers.push({ enabled: true, key: "User-Agent", value: next() || "" })
        break
      case "-e":
      case "--referer":
        headers.push({ enabled: true, key: "Referer", value: next() || "" })
        break
      case "--url":
        url = next()
        break
      case "-G":
      case "--get":
        isGet = true
        break
      case "-F":
      case "--form":
      case "-o":
      case "--output":
        next() // multipart form fields / output redirection aren't representable here — drop
        break
      default:
        if (!t.startsWith("-") && !url) url = t
    }
  }

  if (!url) throw new Error("no URL found")
  if (user) headers.push({ enabled: true, key: "Authorization", value: `Basic ${btoa(user)}` })

  const params = []
  let body = dataParts.join("&")

  if (isGet && body) {
    for (const pair of body.split("&").filter(Boolean)) {
      const [key, value = ""] = pair.split("=")
      params.push({ enabled: true, key: decodeURIComponent(key), value: decodeURIComponent(value) })
    }
    body = ""
  }

  let baseUrl = url
  const qIndex = baseUrl.indexOf("?")
  if (qIndex > -1) {
    const query = baseUrl.slice(qIndex + 1)
    baseUrl = baseUrl.slice(0, qIndex)
    new URLSearchParams(query).forEach((value, key) => params.push({ enabled: true, key, value }))
  }

  return {
    method: method || (body ? "POST" : "GET"),
    url: baseUrl,
    headers,
    params,
    body
  }
}
