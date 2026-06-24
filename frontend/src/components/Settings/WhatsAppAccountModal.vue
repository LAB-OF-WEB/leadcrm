<template>
  <Dialog
    v-model="show"
    :options="{
      title: isEditing ? __('Edit: {0}', [displayAccountName]) : __('Create WhatsApp Account'),
      size: '2xl',
    }"
    @after-leave="resetForm"
  >
    <template #body-content>
      <div v-if="loading && isEditing" class="flex items-center justify-center py-8">
        <LoadingIndicator class="size-8" />
      </div>
      <div v-else class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <FormControl
            v-model="formData.account_name"
            :label="__('Account Name')"
            :placeholder="__('e.g. My WhatsApp Account')"
            type="data"
            size="sm"
            variant="subtle"
          />
          <FormControl
            v-model="formData.status"
            :label="__('Status')"
            type="select"
            size="sm"
            variant="subtle"
            :options="statusOptions"
          />
        </div>
        <FormControl
          v-model="formData.token"
          :label="__('Token')"
          :placeholder="__('WhatsApp Business API Token')"
          type="password"
          size="sm"
          variant="subtle"
        />
        <div class="grid grid-cols-2 gap-4">
          <FormControl
            v-model="formData.url"
            :label="__('URL')"
            :placeholder="__('https://graph.facebook.com')"
            type="data"
            size="sm"
            variant="subtle"
          />
          <FormControl
            v-model="formData.version"
            :label="__('Version')"
            :placeholder="__('e.g. v19.0')"
            type="data"
            size="sm"
            variant="subtle"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormControl
            v-model="formData.phone_id"
            :label="__('Phone ID')"
            :placeholder="__('WhatsApp Phone Number ID')"
            type="data"
            size="sm"
            variant="subtle"
          />
          <FormControl
            v-model="formData.webhook_verify_token"
            :label="__('Webhook Verify Token')"
            :placeholder="__('Webhook Verify Token')"
            type="data"
            size="sm"
            variant="subtle"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormControl
            v-model="formData.app_id"
            :label="__('App ID')"
            :placeholder="__('WhatsApp App ID')"
            type="data"
            size="sm"
            variant="subtle"
          />
          <FormControl
            v-model="formData.business_id"
            :label="__('Business ID')"
            :placeholder="__('WhatsApp Business Account ID')"
            type="data"
            size="sm"
            variant="subtle"
          />
        </div>
        <div class="grid grid-cols-3 gap-4">
          <FormControl
            v-model="formData.is_default_incoming"
            :label="__('Default Incoming')"
            type="checkbox"
            size="sm"
          />
          <FormControl
            v-model="formData.is_default_outgoing"
            :label="__('Default Outgoing')"
            type="checkbox"
            size="sm"
          />
          <FormControl
            v-model="formData.allow_auto_read_receipt"
            :label="__('Auto Read Receipt')"
            type="checkbox"
            size="sm"
          />
        </div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-between">
        <div>
          <Button
            v-if="isEditing"
            variant="subtle"
            :theme="isConfirmingDelete ? 'red' : 'gray'"
            :label="isConfirmingDelete ? __('Confirm Delete') : __('Delete')"
            icon-left="trash-2"
            :loading="deleting"
            @click="handleDelete"
          />
        </div>
        <div class="flex gap-2">
          <Button
            variant="subtle"
            theme="gray"
            :label="__('Cancel')"
            @click="show = false"
          />
          <Button
            variant="solid"
            :label="isEditing ? __('Save') : __('Create')"
            :loading="saving"
            @click="handleSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import {
  Dialog,
  FormControl,
  Button,
  toast,
  LoadingIndicator,
  ErrorMessage,
  call,
} from 'frappe-ui'

const props = defineProps({
  accountName: { type: [String, Object], default: null },
})

const show = defineModel({ type: Boolean, default: false })

const emit = defineEmits(['reload'])

// Resolve account name — might be string or {label, value} from Link
function resolveAccountName(val) {
  if (!val) return null
  if (typeof val === 'object') return val.value || val.label || null
  return val
}

const isEditing = computed(() => !!resolveAccountName(props.accountName))

const displayAccountName = computed(() => {
  const name = resolveAccountName(props.accountName)
  if (!name) return ''
  return name
})

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const isConfirmingDelete = ref(false)
const error = ref('')

const statusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
]

const formData = reactive({
  account_name: '',
  status: 'Inactive',
  token: '',
  url: '',
  version: '',
  webhook_verify_token: '',
  phone_id: '',
  app_id: '',
  business_id: '',
  is_default_incoming: false,
  is_default_outgoing: false,
  allow_auto_read_receipt: true,
})

const originalName = ref('')

watch(
  () => show.value,
  async (isOpen) => {
    const resolvedName = resolveAccountName(props.accountName)
    if (isOpen && resolvedName) {
      loading.value = true
      originalName.value = resolvedName
      try {
        const doc = await call('frappe.client.get', {
          doctype: 'WhatsApp Account',
          name: resolvedName,
          fields: ['*'],
        })
        Object.assign(formData, {
          account_name: doc.account_name || '',
          status: doc.status || 'Inactive',
          token: doc.token || '',
          url: doc.url || '',
          version: doc.version || '',
          webhook_verify_token: doc.webhook_verify_token || '',
          phone_id: doc.phone_id || '',
          app_id: doc.app_id || '',
          business_id: doc.business_id || '',
          is_default_incoming: Boolean(doc.is_default_incoming),
          is_default_outgoing: Boolean(doc.is_default_outgoing),
          allow_auto_read_receipt: Boolean(doc.allow_auto_read_receipt),
        })
      } catch (e) {
        error.value = e.message || __('Failed to load account')
      } finally {
        loading.value = false
      }
    } else if (isOpen) {
      originalName.value = ''
    }
  },
)

function resetForm() {
  Object.assign(formData, {
    account_name: '',
    status: 'Inactive',
    token: '',
    url: '',
    version: '',
    webhook_verify_token: '',
    phone_id: '',
    app_id: '',
    business_id: '',
    is_default_incoming: false,
    is_default_outgoing: false,
    allow_auto_read_receipt: true,
  })
  originalName.value = ''
  isConfirmingDelete.value = false
  error.value = ''
}

function validate() {
  if (!formData.account_name) {
    error.value = __('Account Name is required')
    return false
  }
  if (!isEditing.value && !formData.token) {
    error.value = __('Token is required')
    return false
  }
  error.value = ''
  return true
}

async function handleSave() {
  if (!validate()) return

  saving.value = true
  try {
    const data = { ...formData }

    // Don't send empty token on edit (preserve existing)
    if (isEditing.value && !data.token) {
      delete data.token
    }

    if (isEditing.value) {
      // Rename if name changed
      if (originalName.value !== data.account_name) {
        await call('frappe.client.rename_doc', {
          doctype: 'WhatsApp Account',
          old_name: originalName.value,
          new_name: data.account_name,
        })
      }

      // Update fields
      await call('frappe.client.set_value', {
        doctype: 'WhatsApp Account',
        name: data.account_name,
        fieldname: data,
      })

      toast.success(__('WhatsApp Account updated successfully'))
    } else {
      await call('frappe.client.insert', {
        doc: {
          doctype: 'WhatsApp Account',
          ...data,
        },
      })
      toast.success(__('WhatsApp Account created successfully'))
    }

    show.value = false
    emit('reload')
  } catch (e) {
    error.value = e.message || __('Failed to save account')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!isConfirmingDelete.value) {
    isConfirmingDelete.value = true
    return
  }

  deleting.value = true
  try {
    await call('crm.api.whatsapp.delete_whatsapp_account', {
      account_name: originalName.value,
    })
    toast.success(__('WhatsApp Account deleted successfully'))
    show.value = false
    emit('reload')
  } catch (e) {
    error.value = e.message || __('Failed to delete account')
  } finally {
    deleting.value = false
  }
}
</script>
