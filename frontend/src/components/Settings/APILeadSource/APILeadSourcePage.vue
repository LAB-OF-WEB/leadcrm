<template>
  <div class="flex h-full flex-col gap-6 p-8">
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold text-ink-gray-8">API Lead Sources</h2>
        <p class="text-sm text-ink-gray-5 mt-1">
          Configure external APIs to periodically fetch leads
        </p>
      </div>
      <Button
        label="Create New"
        variant="solid"
        icon-left="plus"
        @click="openCreateForm"
      />
    </div>

    <div v-if="sources.loading" class="flex flex-1 items-center justify-center">
      <LoadingIndicator class="size-8" />
    </div>

    <div v-else-if="sources.data?.length" class="flex-1 overflow-y-auto">
      <div class="border rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-surface-gray-2 text-ink-gray-6">
            <tr>
              <th class="text-left px-4 py-2 font-medium">Source Name</th>
              <th class="text-left px-4 py-2 font-medium">API URL</th>
              <th class="text-left px-4 py-2 font-medium">Frequency</th>
              <th class="text-left px-4 py-2 font-medium">Last Synced</th>
              <th class="text-center px-4 py-2 font-medium">Enabled</th>
              <th class="text-center px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="source in sources.data"
              :key="source.name"
              class="border-t hover:bg-surface-gray-1"
            >
              <td class="px-4 py-3 font-medium">{{ source.source_name }}</td>
              <td class="px-4 py-3 text-ink-gray-6 truncate max-w-xs">
                {{ source.api_url }}
              </td>
              <td class="px-4 py-3 text-ink-gray-6">
                {{ source.background_sync_frequency }}
              </td>
              <td class="px-4 py-3 text-ink-gray-6">
                {{ source.last_synced_at ? formatTime(source.last_synced_at) : 'Never' }}
              </td>
              <td class="px-4 py-3 text-center">
                <Switch
                  :modelValue="source.enabled"
                  @update:modelValue="(val) => toggleEnabled(source, val)"
                />
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    icon="play"
                    size="sm"
                    @click="syncNow(source)"
                    :loading="source._syncing"
                  />
                  <Button
                    variant="ghost"
                    icon="edit"
                    size="sm"
                    @click="openEditForm(source)"
                  />
                  <Button
                    variant="ghost"
                    icon="trash-2"
                    size="sm"
                    theme="red"
                    @click="deleteSource(source)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="flex flex-1 items-center justify-center">
      <div class="text-center text-ink-gray-5">
        <p class="text-lg font-medium mb-1">No API Lead Sources</p>
        <p class="text-sm mb-4">Create your first source to start fetching leads from an API</p>
        <Button label="Create Source" variant="solid" icon-left="plus" @click="openCreateForm" />
      </div>
    </div>

    <Dialog
      v-model="showForm"
      :options="{ size: '4xl', title: editingSource ? 'Edit API Lead Source' : 'New API Lead Source' }"
    >
      <template #body>
        <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <FormControl
            v-model="form.source_name"
            label="Source Name"
            :required="true"
            :disabled="editingSource"
          />
          <FormControl
            v-model="form.api_url"
            label="API URL"
            :required="true"
            placeholder="https://api.example.com/leads"
          />
          <div class="grid grid-cols-2 gap-4">
            <FormControl
              v-model="form.auth_type"
              label="Authentication Type"
              type="select"
              :options="[
                { label: 'No Auth', value: 'No Auth' },
                { label: 'Header', value: 'Header' },
                { label: 'Bearer Token', value: 'Bearer Token' },
                { label: 'Query Parameter', value: 'Query Parameter' },
              ]"
            />
            <FormControl
              v-if="form.auth_type === 'Header'"
              v-model="form.auth_header_name"
              label="Header Name"
              placeholder="X-API-Key"
            />
          </div>
          <FormControl
            v-if="form.auth_type !== 'No Auth'"
            v-model="form.api_key"
            label="API Key / Token"
            type="password"
          />
          <div class="grid grid-cols-2 gap-4">
            <FormControl
              v-model="form.start_time_param"
              label="Start Time Parameter"
              placeholder="start_date"
            />
            <FormControl
              v-model="form.end_time_param"
              label="End Time Parameter"
              placeholder="end_date"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <FormControl
              v-model="form.time_format"
              label="Time Format"
              type="select"
              :options="[
                { label: 'ISO 8601', value: 'ISO 8601' },
                { label: 'UNIX Timestamp', value: 'UNIX Timestamp' },
              ]"
            />
            <FormControl
              v-model="form.response_path"
              label="Response Data Path"
              placeholder="data.leads (leave empty if root is array)"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <FormControl
              v-model="form.background_sync_frequency"
              label="Sync Frequency"
              type="select"
              :options="[
                { label: 'Every 5 Minutes', value: 'Every 5 Minutes' },
                { label: 'Every 10 Minutes', value: 'Every 10 Minutes' },
                { label: 'Every 15 Minutes', value: 'Every 15 Minutes' },
                { label: 'Hourly', value: 'Hourly' },
                { label: 'Daily', value: 'Daily' },
              ]"
            />
            <FormControl
              v-model="form.default_source"
              label="Default Source"
              type="autocomplete"
              :options="sourceOptions"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <FormControl
              v-model="form.default_status"
              label="Default Status"
              type="autocomplete"
              :options="statusOptions"
            />
            <FormControl
              v-model="form.default_lead_owner"
              label="Default Lead Owner"
              type="autocomplete"
              :options="userOptions"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium text-ink-gray-7">Field Mapping</label>
              <Button label="Add Mapping" variant="ghost" size="sm" icon-left="plus" @click="addMapping" />
            </div>
            <div v-if="form.field_mapping?.length" class="space-y-2">
              <div
                v-for="(mapping, idx) in form.field_mapping"
                :key="idx"
                class="grid grid-cols-3 gap-2 items-center"
              >
                <FormControl v-model="mapping.source_field" placeholder="Source field name" />
                <FormControl
                  v-model="mapping.target_field"
                  type="select"
                  :options="crmFieldOptions"
                />
                <div class="flex items-center gap-1">
                  <FormControl v-model="mapping.default_value" placeholder="Default (optional)" class="flex-1" />
                  <Button variant="ghost" icon="x" size="sm" @click="removeMapping(idx)" />
                </div>
              </div>
            </div>
            <p v-else class="text-sm text-ink-gray-4 italic">No field mappings configured</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" variant="subtle" @click="showForm = false" />
          <Button
            :label="editingSource ? 'Update' : 'Create'"
            variant="solid"
            :loading="saving"
            @click="saveSource"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { createListResource, createResource, Switch, LoadingIndicator, toast, Dialog } from 'frappe-ui'
import { ref, reactive } from 'vue'

const showForm = ref(false)
const editingSource = ref(null)
const saving = ref(false)

const defaultForm = () => ({
  source_name: '',
  api_url: '',
  auth_type: 'Header',
  auth_header_name: 'X-API-Key',
  api_key: '',
  start_time_param: 'start_time',
  end_time_param: 'end_time',
  time_format: 'ISO 8601',
  response_path: '',
  background_sync_frequency: 'Hourly',
  default_source: '',
  default_status: '',
  default_lead_owner: '',
  field_mapping: [],
  enabled: 1,
})

const form = reactive(defaultForm())

const sources = createListResource({
  type: 'list',
  doctype: 'API Lead Source',
  cache: 'api_lead_sources',
  fields: ['name', 'source_name', 'enabled', 'api_url', 'background_sync_frequency', 'last_synced_at'],
  auto: true,
  orderBy: 'modified desc',
  pageLength: 50,
})

const crmFieldOptions = [
  'first_name', 'last_name', 'email', 'mobile_no', 'phone',
  'organization', 'website', 'job_title', 'industry', 'territory',
  'source', 'lead_owner', 'status', 'gender', 'salutation',
  'no_of_employees', 'annual_revenue', 'lead_name', 'middle_name',
].map((f) => ({ label: f, value: f }))

const sourceOptions = []
const statusOptions = []
const userOptions = []

function openCreateForm() {
  editingSource.value = null
  Object.assign(form, defaultForm())
  showForm.value = true
}

function openEditForm(source) {
  editingSource.value = source
  loadSourceDoc(source.name)
  showForm.value = true
}

function loadSourceDoc(name) {
  createResource({
    url: 'frappe.client.get',
    params: { doctype: 'API Lead Source', name },
    auto: true,
    onSuccess: (doc) => {
      Object.assign(form, {
        source_name: doc.source_name,
        api_url: doc.api_url,
        auth_type: doc.auth_type,
        auth_header_name: doc.auth_header_name,
        api_key: doc.api_key ? '••••••••' : '',
        start_time_param: doc.start_time_param,
        end_time_param: doc.end_time_param,
        time_format: doc.time_format,
        response_path: doc.response_path,
        background_sync_frequency: doc.background_sync_frequency,
        default_source: doc.default_source,
        default_status: doc.default_status,
        default_lead_owner: doc.default_lead_owner,
        enabled: doc.enabled,
        field_mapping: (doc.field_mapping || []).map((m) => ({
          source_field: m.source_field,
          target_field: m.target_field,
          default_value: m.default_value,
        })),
      })
    },
  })
}

function addMapping() {
  if (!form.field_mapping) form.field_mapping = []
  form.field_mapping.push({ source_field: '', target_field: 'first_name', default_value: '' })
}

function removeMapping(idx) {
  form.field_mapping.splice(idx, 1)
}

function saveSource() {
  if (!form.source_name || !form.api_url) {
    toast.error('Source Name and API URL are required')
    return
  }

  saving.value = true
  const data = { ...form }
  if (data.api_key === '••••••••') delete data.api_key

  const url = editingSource.value
    ? 'frappe.client.set_value'
    : 'frappe.client.insert'

  const params = editingSource.value
    ? { doctype: 'API Lead Source', name: editingSource.value.name, fieldname: data }
    : { doc: { doctype: 'API Lead Source', ...data } }

  createResource({
    url,
    params,
    auto: true,
    onSuccess: () => {
      toast.success(editingSource.value ? 'Updated successfully' : 'Created successfully')
      showForm.value = false
      saving.value = false
      sources.reload()
    },
    onError: (err) => {
      toast.error(err.message)
      saving.value = false
    },
  })
}

function toggleEnabled(source, val) {
  createResource({
    url: 'frappe.client.set_value',
    params: { doctype: 'API Lead Source', name: source.name, fieldname: { enabled: val } },
    auto: true,
    onSuccess: () => {
      sources.reload()
    },
  })
}

function syncNow(source) {
  source._syncing = true
  createResource({
    url: 'frappe.client.run_doc_method',
    params: { docs: JSON.stringify({ doctype: 'API Lead Source', name: source.name }), method: 'sync_leads' },
    auto: true,
    onSuccess: () => {
      toast.success('Sync initiated')
      source._syncing = false
    },
    onError: () => {
      source._syncing = false
    },
  })
}

function deleteSource(source) {
  createResource({
    url: 'frappe.client.delete',
    params: { doctype: 'API Lead Source', name: source.name },
    auto: true,
    onSuccess: () => {
      toast.success('Deleted')
      sources.reload()
    },
  })
}

function formatTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleString()
}
</script>
