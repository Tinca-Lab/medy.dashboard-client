<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";
import dayjs from "dayjs";

definePageMeta({
  auth: true,
  layout: 'pre'
})

useHead({
  title: 'Papelería'
})

const columns = [
  {
    label: 'Numero',
    key: 'serial',
    sortable: true
  },
  {
    label: 'Tipo',
    key: 'kind',
    sortable: true
  },
  {
    label: 'Cargado a',
    key: 'givenBy',
  },
  {
    label: 'Creado en',
    key: 'createdAt',
    sortable: true
  },
  {
    label: 'Acciones',
    key: 'actions',
    sortable: false
  }
];
const documentOptions = [
  {
    label: 'Contrato',
    value: 'CONTRACT'
  },
  {
    label: 'Recibo',
    value: 'RECEIPT'
  },
];

const creatingDocumentsSchema = z.object({
  kind: z.string({
    message: 'Tipo de documento inválido'
  }),
  prefix: z.string({
    message: 'Prefijo inválido'
  }).regex(/[aA-zZ]/, {
    message: 'El prefijo debe ser una letra'
  }),
  from: z.number({
    message: 'Desde inválido'
  }).int(),
  to: z.number({
    message: 'Hasta inválido'
  }).int()
});
const uploadingDocumentsSchema = z.object({
  kind: z.string({
    message: 'Tipo de documento inválido'
  }),
  prefix: z.string({
    message: 'Prefijo inválido'
  }).regex(/[aA-zZ]/, {
    message: 'El prefijo debe ser una letra'
  }),
  from: z.number({
    message: 'Desde inválido'
  }).int(),
  to: z.number({
    message: 'Hasta inválido'
  }).int(),
  user: z.string({
    message: 'Usuario inválido'
  })
});

const toast = useToast();
const {$api} = useNuxtApp();

const isUploadingDocuments: Ref<boolean> = ref(false);
const isLoadingUploadingDocuments: Ref<boolean> = ref(false);

const isCreatingDocuments: Ref<boolean> = ref(false);
const isLoadingCreatingDocuments: Ref<boolean> = ref(false);

const serial: Ref<string> = ref('');
const queryAssistant: Ref<string> = ref('');

const page: Ref<number> = ref(1);
const pageSize: Ref<number> = ref(10);
const sortBy: Ref<string> = ref('createdAt');
const sort: Ref<string> = ref('desc');

const payload: Ref<{
  kind: string,
  prefix: string,
  from: number,
  to: number
}> = ref({
  kind: '',
  prefix: '',
  from: 0,
  to: 0
})

const uploadingPayload: Ref<{
  kind: string,
  prefix: string,
  from: number,
  to: number,
  userId: string
}> = ref({
  kind: '',
  prefix: '',
  from: 0,
  to: 0,
  userId: ''
})

const {data: documents, refresh: FetchDocuments} = await useApi<any[]>('/document', {
  params: {
    page: page,
    pageSize: pageSize,
    sortBy: sortBy,
    sort: sort,
    filters: {
      serial: {
        $regex: serial,
        $options: 'i'
      }
    }
  },
  watch: [page, pageSize, sortBy, sort],
  transform: (data) => {
    return data.map((document: any) => ({
      createdAt: dayjs(document.createdAt).format('MMM D, YYYY'),
      kind: document.kind === 'CONTRACT' ? 'Contrato' : 'Recibo',
      serial: document.serial,
      givenBy: document.givenBy || 'NO ASIGNADO',
    }))
  }
});

const {data: count} = await useApi<number>('/document/count', {
  params: {
    filters: {
      serial: {
        $regex: serial,
        $options: 'i'
      }
    }
  },
  default() {
    return 0;
  },
  watch: [serial],
  transform: (data) => {
    return Number(data);
  }
});

const {data: assistants, refresh: FetchAssistants} = await useApi<any[]>('/users', {
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
    filters: {

      $or: [
        {
          document: {
            $regex: queryAssistant,
            $options: 'i'
          },
        },
        {
          name: {
            $regex: queryAssistant,
            $options: 'i'
          },
        },
        {
          lastname: {
            $regex: queryAssistant,
            $options: 'i'
          }
        }
      ],
      kind: 'ASSISTANT'
    },
  },
  transform: (data) => {
    return data.map((assistant: any) => ({
      _id: assistant._id,
      full_name: `${assistant.name} ${assistant.lastname}`
    }))
  }
});

const creatingDocumentsState = computed(() => ({
  kind: payload.value.kind,
  prefix: payload.value.prefix,
  from: payload.value.from,
  to: payload.value.to
}));

const uploadingDocumentsState = computed(() => ({
  kind: uploadingPayload.value.kind,
  prefix: uploadingPayload.value.prefix,
  from: uploadingPayload.value.from,
  to: uploadingPayload.value.to,
  user: uploadingPayload.value.userId
}));

const onCreateDocuments = async () => {
  isLoadingCreatingDocuments.value = true;
  try {
    await $api('/document', {
      method: 'POST',
      body: {
        kind: payload.value.kind,
        prefix: payload.value.prefix.toUpperCase(),
        from: payload.value.from,
        to: payload.value.to
      }
    });
    isLoadingCreatingDocuments.value = false;
    FetchDocuments();
    toast.add({
      title: '¡Listo!',
      description: 'Documentos creados correctamente',
      color: 'green'
    })
    payload.value = {
      kind: '',
      prefix: '',
      from: 0,
      to: 0
    }
    isLoadingCreatingDocuments.value = false;
    isCreatingDocuments.value = false;
  } catch (e: unknown | any) {
    isLoadingCreatingDocuments.value = false;
    isCreatingDocuments.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error inesperado al crear los documentos',
      color: 'red'
    });
  }
};

const onAssignDocuments = async () => {
  isLoadingUploadingDocuments.value = true;
  try {
    await $api('/document/assign', {
      method: 'POST',
      body: {
        kind: uploadingPayload.value.kind,
        prefix: uploadingPayload.value.prefix.toUpperCase(),
        from: uploadingPayload.value.from,
        to: uploadingPayload.value.to,
        userId: uploadingPayload.value.userId
      }
    });
    isLoadingUploadingDocuments.value = false;
    FetchDocuments();
    toast.add({
      title: '¡Listo!',
      description: 'Documentos assignados correctamente',
      color: 'green'
    })
    payload.value = {
      kind: '',
      prefix: '',
      from: 0,
      to: 0
    }
    isLoadingUploadingDocuments.value = false;
    isUploadingDocuments.value = false;
  } catch (e: unknown | any) {
    isLoadingUploadingDocuments.value = false;
    isUploadingDocuments.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error inesperado al asignar los documentos',
      color: 'red'
    });
  }
}

const onSearchAssistants = async (q: string) => {
  queryAssistant.value = q;
  await FetchAssistants();
  return assistants.value;
}
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-center text-2xl">
      Papelería
    </h2>
    <nav class="flex justify-between items-end">
      <!--   TODO:   Cambiar por UForm -->
      <UFormGroup
          label="Serial del documento"
          required
      >
        <UInput
            required
            v-model="serial"
            placeholder="eg. A1040133"
        />
      </UFormGroup>
      <article class="space-x-2">
        <UButton
            @click="isUploadingDocuments = !isUploadingDocuments"
            variant="outline"
            trailing-icon="i-heroicons-arrow-up-on-square-stack">
          Cargar documentos
        </UButton>
        <UButton
            @click="isCreatingDocuments = !isCreatingDocuments"
            trailing-icon="i-heroicons-plus">
          Crear documentos
        </UButton>
      </article>
    </nav>
    <UTable
        :columns="columns"
        :rows="documents || []"
        class="bg-white dark:bg-gray-900 rounded-xl shadow"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <p class="text-gray-500 dark:text-gray-400">No hay documentos</p>
        </div>
      </template>
    </UTable>
    <!--    -->
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
    <!--    -->
    <Teleport to="body">
      <UModal v-model="isCreatingDocuments">
        <article>
          <UForm
              :schema="creatingDocumentsSchema"
              :state="creatingDocumentsState"
              class="p-4 space-y-4"
              @submit="onCreateDocuments">

            <UFormGroup
                label="Tipo de documento"
                name="kind"
                required>
              <USelect
                  v-model="payload.kind"
                  required
                  placeholder="Seleccione un tipo"
                  :options="documentOptions"
              />
            </UFormGroup>

            <UFormGroup
                label="Prefijo"
                name="prefix"
                required>
              <UInput
                  type="text"
                  v-model="payload.prefix"
                  input-class="uppercase"
                  minlength="1"
                  maxlength="1"
                  patter="[A-Z]"
                  placeholder="eg. A"
              />
            </UFormGroup>

            <UFormGroup
                label="Desde"
                name="from"
                required>
              <UInput
                  v-model="payload.from"
                  type="number"
                  required
                  placeholder="eg. 100000"
              />
            </UFormGroup>

            <UFormGroup
                label="Hasta"
                name="to"
                required>
              <UInput
                  v-model="payload.to"
                  type="number"
                  required
                  placeholder="eg. 100100"
              />
            </UFormGroup>

            <UButton
                :loading="isLoadingCreatingDocuments"
                :disabled="isLoadingCreatingDocuments"
                type="submit" block>
              Crear documentos
            </UButton>
          </UForm>
        </article>
      </UModal>
    </Teleport>
    <Teleport to="body">
      <UModal v-model="isUploadingDocuments">
        <article>
          <UForm
              :schema="uploadingDocumentsSchema"
              :state="uploadingDocumentsState"
              class="p-4 space-y-4"
              @submit="onAssignDocuments">

            <UFormGroup
                label="Asesor"
                name="user"
                required
            >
              <USelectMenu
                  searchable-placeholder="Buscar asesor"
                  :options="assistants || []"
                  :searchable="onSearchAssistants"
                  placeholder="Seleccione un asesor"
                  option-attribute="full_name"
                  value-attribute="_id"
                  v-model="uploadingPayload.userId"
              />
            </UFormGroup>

            <UFormGroup
                label="Tipo de documento"
                name="kind"
                required>
              <USelect
                  v-model="uploadingPayload.kind"
                  required
                  placeholder="Seleccione un tipo"
                  :options="documentOptions"
              />
            </UFormGroup>

            <UFormGroup
                label="Prefijo"
                name="prefix"
                required>
              <UInput
                  type="text"
                  v-model="uploadingPayload.prefix"
                  input-class="uppercase"
                  minlength="1"
                  maxlength="1"
                  patter="[A-Z]"
                  placeholder="eg. A"
              />
            </UFormGroup>

            <UFormGroup
                label="Desde"
                name="from"
                required>
              <UInput
                  v-model="uploadingPayload.from"
                  type="number"
                  required
                  placeholder="eg. 100000"
              />
            </UFormGroup>

            <UFormGroup
                label="Hasta"
                name="to"
                required>
              <UInput
                  v-model="uploadingPayload.to"
                  type="number"
                  required
                  placeholder="eg. 100100"
              />
            </UFormGroup>

            <UButton
                :loading="isLoadingUploadingDocuments"
                :disabled="isLoadingUploadingDocuments"
                type="submit" block>
              Cargar documentos
            </UButton>
          </UForm>
        </article>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
