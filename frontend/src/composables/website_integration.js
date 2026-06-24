import { createResource } from 'frappe-ui'
import { ref } from 'vue'

export const isWebsiteIntegrationInstalled = ref(false)
export const isAPILeadSourceInstalled = ref(false)

createResource({
  url: 'leadcrm_extensions.api.website_integration.is_installed',
  cache: 'Is Website Integration Installed',
  auto: true,
  onSuccess: (data) => {
    isWebsiteIntegrationInstalled.value = Boolean(data)
  },
})

createResource({
  url: 'leadcrm_extensions.api.website_integration.is_api_lead_source_installed',
  cache: 'Is API Lead Source Installed',
  auto: true,
  onSuccess: (data) => {
    isAPILeadSourceInstalled.value = Boolean(data)
  },
})
