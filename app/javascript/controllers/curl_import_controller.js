import { Controller } from "@hotwired/stimulus"
import { parseCurl } from "curl_parser"

// Lets you paste a curl command and fills in the URL, method, headers,
// params, and body fields it finds. Delegates to the name-value-rows
// controllers already managing the Headers/Params tabs.
export default class extends Controller {
  static targets = ["box", "input", "url", "method", "body", "headersRows", "paramsRows"]

  toggle(event) {
    event.preventDefault()
    this.boxTarget.classList.toggle("hidden")
    if (!this.boxTarget.classList.contains("hidden")) this.inputTarget.focus()
  }

  import(event) {
    event.preventDefault()
    const text = this.inputTarget.value.trim()
    if (!text) return

    let parsed
    try {
      parsed = parseCurl(text)
    } catch (e) {
      alert(`Couldn't parse that as a curl command: ${e.message}`)
      return
    }

    this.urlTarget.value = parsed.url
    this.methodTarget.value = parsed.method
    this.bodyTarget.value = parsed.body
    this.rowsController(this.headersRowsTarget).setRows(parsed.headers)
    this.rowsController(this.paramsRowsTarget).setRows(parsed.params)

    this.inputTarget.value = ""
    this.boxTarget.classList.add("hidden")
  }

  rowsController(element) {
    return this.application.getControllerForElementAndIdentifier(element, "name-value-rows")
  }
}
