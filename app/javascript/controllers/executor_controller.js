import { Controller } from "@hotwired/stimulus"

// Handles the request editor: submits the form state to /execute (backend proxy),
// renders the raw HTTP response (status, headers, time, body) into the response pane.
export default class extends Controller {
  static targets = ["response", "status", "time", "error", "headers", "body", "send"]

  submit(event) {
    // Let the "Save" button (name=commit) flow through Turbo normally
    if (event.submitter?.name === "commit") return
    event.preventDefault()
    this.sendRequest(event.target)
  }

  async sendRequest(form) {
    const btn = this.sendTarget
    btn.disabled = true
    const originalLabel = btn.textContent
    btn.textContent = "Sending…"

    const token = document.querySelector('meta[name="csrf-token"]')?.content
    try {
      const response = await fetch("/execute", {
        method: "POST",
        headers: { "X-CSRF-Token": token, "Accept": "application/json" },
        body: new FormData(form)
      })
      const data = await response.json()
      this.render(data)
    } catch (e) {
      this.showError(`Request failed: ${e.message}`)
    } finally {
      btn.disabled = false
      btn.textContent = originalLabel
    }
  }

  render(data) {
    this.responseTarget.hidden = false

    if (data.error) {
      this.showError(data.error)
      this.statusTarget.textContent = ""
      this.timeTarget.textContent = ""
      this.headersTarget.innerHTML = ""
      this.bodyTarget.textContent = ""
      return
    }

    this.errorTarget.hidden = true
    this.errorTarget.textContent = ""

    // Status pill, colored by class
    const status = this.statusTarget
    status.className = `status-pill status-${String(data.status)[0]}xx`
    status.textContent = `${data.status} ${this.statusText(data.status)}`

    this.timeTarget.textContent = data.duration_ms != null ? `⏱ ${data.duration_ms} ms` : ""

    // Headers
    const entries = Object.entries(data.headers || {})
    if (entries.length) {
      this.headersTarget.innerHTML =
        '<div class="headers-title">Response headers</div>' +
        entries.map(([k, v]) =>
          `<div class="header-row"><span class="header-key"></span><span class="header-value"></span></div>`
        ).join("")
      // Fill via textContent to avoid any HTML injection from header values
      this.headersTarget.querySelectorAll(".header-row").forEach((row, i) => {
        row.querySelector(".header-key").textContent = entries[i][0]
        row.querySelector(".header-value").textContent = entries[i][1]
      })
      this.headersTarget.hidden = false
    } else {
      this.headersTarget.hidden = true
    }

    // Body — pretty-print JSON, else raw text
    const body = this.prettify(data.body)
    this.bodyTarget.textContent = body.length > 500_000 ? body.slice(0, 500_000) + "\n… (truncated for display)" : body
  }

  prettify(raw) {
    if (!raw) return "(empty response)"
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  statusText(code) {
    const map = {
      200: "OK", 201: "Created", 202: "Accepted", 204: "No Content",
      301: "Moved Permanently", 302: "Found", 304: "Not Modified",
      400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found",
      409: "Conflict", 422: "Unprocessable Entity", 429: "Too Many Requests",
      500: "Internal Server Error", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout"
    }
    return map[code] || ""
  }

  showError(message) {
    this.responseTarget.hidden = false
    this.errorTarget.hidden = false
    this.errorTarget.textContent = message
  }
}