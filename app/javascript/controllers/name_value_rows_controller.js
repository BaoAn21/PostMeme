import { Controller } from "@hotwired/stimulus"

// Generic key/value row editor, used for both Params and Headers.
// Disabled rows (unchecked) are still submitted but skipped server-side.
export default class extends Controller {
  static targets = ["container", "template", "row"]

  addRow(event) {
    event.preventDefault()
    const row = this.templateTarget.content.firstElementChild.cloneNode(true)
    this.containerTarget.appendChild(row)
    // Focus the new key input
    row.querySelector(".nv-key")?.focus()
  }

  removeRow(event) {
    event.preventDefault()
    event.currentTarget.closest('[data-name-value-rows-target="row"]')?.remove()
  }
}