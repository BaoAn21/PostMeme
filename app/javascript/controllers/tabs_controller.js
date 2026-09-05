import { Controller } from "@hotwired/stimulus"

// Simple tab switcher for Params / Headers / Body panels.
export default class extends Controller {
  show(event) {
    const name = event.currentTarget.dataset.tab
    this.element.querySelectorAll(".tab-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === name)
    })
    this.element.querySelectorAll("[data-tab-panel]").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.tabPanel !== name)
    })
  }
}