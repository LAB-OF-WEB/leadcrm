<template>
  <div class="flex h-full flex-col gap-6 p-8">
    <!-- Header -->
    <div class="flex justify-between">
      <div class="flex flex-col gap-1 w-9/12">
        <div class="flex gap-1 items-center">
          <h2
            class="flex gap-2 text-xl font-semibold leading-none h-5 text-ink-gray-8"
          >
            {{ __('WhatsApp Settings') }}
          </h2>
          <Badge
            v-if="docData.isDirty"
            :label="__('Not Saved')"
            variant="subtle"
            theme="orange"
          />
        </div>
      </div>
      <div class="flex item-center space-x-2 w-3/12 justify-end">
        <Button
          :loading="docData.save.loading"
          :label="__('Update')"
          variant="solid"
          @click="docData.save.submit()"
        />
      </div>
    </div>

    <!-- Content -->
    <div v-if="!docData.get.loading" class="flex-1 overflow-y-auto">
      <FieldLayout
        v-if="docData?.doc && tabs"
        :tabs="tabs"
        :data="docData.doc"
        doctype="WhatsApp Settings"
      />
    </div>
    <div v-else class="flex flex-1 items-center justify-center">
      <LoadingIndicator class="size-8" />
    </div>

    <ErrorMessage :message="docData.save.error" />

    <!-- WhatsApp Account Modal -->
    <WhatsAppAccountModal
      v-model="showModal"
      :account-name="editingAccountName"
      @reload="onAccountReload"
    />
  </div>
</template>

<script setup>
import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'
import WhatsAppAccountModal from '@/components/Settings/WhatsAppAccountModal.vue'
import {
  createDocumentResource,
  createResource,
  LoadingIndicator,
  Badge,
  toast,
  ErrorMessage,
} from 'frappe-ui'
import { getRandom } from '@/utils'
import { computed, ref } from 'vue'

const showModal = ref(false)
const editingAccountName = ref(null)

function openEditModal(accountName, close) {
  editingAccountName.value = accountName
  showModal.value = true
  if (close) close()
}

function onCreateAccount(close) {
  editingAccountName.value = null
  showModal.value = true
  if (close) close()
}

const fields = createResource({
  url: 'crm.api.doc.get_fields',
  cache: ['fields', 'WhatsApp Settings'],
  params: {
    doctype: 'WhatsApp Settings',
    allow_all_fieldtypes: true,
  },
  auto: true,
  onSuccess: (data) => {
    // Inject edit/create callbacks for WhatsApp Account Link fields
    data.forEach((field) => {
      if (field.fieldtype === 'Link' && field.options === 'WhatsApp Account') {
        // Called from Link dropdown footer: (value, close)
        // Called from Field.vue button: (accountName)
        field.edit = (accountName, close) => openEditModal(accountName, close)
        field.create = (value, close) => onCreateAccount(close)
      }
    })
  },
})

const docData = createDocumentResource({
  doctype: 'WhatsApp Settings',
  name: 'WhatsApp Settings',
  fields: ['*'],
  auto: true,
  setValue: {
    onSuccess: () => {
      toast.success(__('WhatsApp Settings updated successfully'))
    },
    onError: (err) => {
      toast.error(err.message + ': ' + (err.messages?.[0] || ''))
    },
  },
})

function onAccountReload() {
  docData.reload()
}

const tabs = computed(() => {
  if (!fields.data) return []
  let _tabs = []
  let fieldsData = fields.data

  if (fieldsData[0].type != 'Tab Break') {
    let _sections = []
    if (fieldsData[0].type != 'Section Break') {
      _sections.push({
        name: 'first_section',
        columns: [{ name: 'first_column', fields: [] }],
      })
    }
    _tabs.push({ name: 'first_tab', sections: _sections })
  }

  fieldsData.forEach((field) => {
    let last_tab = _tabs[_tabs.length - 1]
    let _sections = _tabs.length ? last_tab.sections : []
    if (field.fieldtype === 'Tab Break') {
      _tabs.push({
        label: field.label,
        name: field.fieldname,
        sections: [
          {
            name: 'section_' + getRandom(),
            columns: [{ name: 'column_' + getRandom(), fields: [] }],
          },
        ],
      })
    } else if (field.fieldtype === 'Section Break') {
      _sections.push({
        label: field.label,
        name: field.fieldname,
        hideBorder: field.hide_border,
        columns: [{ name: 'column_' + getRandom(), fields: [] }],
      })
    } else if (field.fieldtype === 'Column Break') {
      _sections[_sections.length - 1].columns.push({
        name: field.fieldname,
        fields: [],
      })
    } else {
      let last_section = _sections[_sections.length - 1]
      let last_column = last_section.columns[last_section.columns.length - 1]
      last_column.fields.push(field)
    }
  })

  return _tabs
})
</script>
