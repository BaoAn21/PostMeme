import { Controller } from "@hotwired/stimulus"

// Generic key/value row editor, used for both Params and Headers.
// Disabled rows (unchecked) are still submitted but skipped server-side.
export default class extends Controller {
  static targets = ["container", "template", "row"]

  addRow(event) {
    event.preventDefault()
    const row = this.addRowFrom({})
    row.querySelector(".nv-key")?.focus()
  }

  removeRow(event) {
    event.preventDefault()
    event.currentTarget.closest('[data-name-value-rows-target="row"]')?.remove()
  }

  // Replace all rows with the given [{enabled, key, value}] list — used by curl import.
  setRows(rows) {
    this.rowTargets.forEach((row) => row.remove())
    rows.forEach((row) => this.addRowFrom(row))
  }

  addRowFrom({ enabled = true, key = "", value = "" }) {
    const row = this.templateTarget.content.firstElementChild.cloneNode(true)
    row.querySelector('input[type="checkbox"]').checked = enabled
    row.querySelector(".nv-key").value = key
    row.querySelector(".nv-value").value = value
    this.containerTarget.appendChild(row)
    return row
  }
}