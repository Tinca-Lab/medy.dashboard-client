<script setup lang="ts">
import {z} from "zod";
import type {Ref} from "vue";

definePageMeta({
  auth: true,
  layout: 'pre'
})

useHead({
  title: 'Editar papeleria'
})

const router = useRouter();
const toast = useToast();
const route = useRoute();
const {$api} = useNuxtApp();

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
const editingDocumentSchema = z.object({
  kind: z.string({
    message: 'Tipo de documento inválido'
  }),
  prefix: z.string({
    message: 'Prefijo inválido'
  }).nullable(),
  givenBy: z.object({
    _id: z.string(),
    name: z.string(),
    lastname: z.string(),
    full_name: z.string()
  }),
  serial: z.string({
    message: 'Serial inválido'
  }).regex(/^[0-9]*$/, {
    message: 'El serial solo permite numeros'
  })
});

const isLoadingEditingDocument: Ref<boolean> = ref(false);

const {data: document, error: errorDocument} = await useApi<{
  kind: string;
  prefix: string;
  givenBy: {
    _id: string;
    name: string;
    lastname: string;
  };
  serial: string;
}>(`/document/${route.params.id}`, {
  method: 'GET',
  transform: (data) => ({
    kind: data.kind,
    prefix: data.prefix,
    givenBy: data.givenBy ? {
      _id: data.givenBy._id,
      name: data.givenBy.name,
      lastname: data.givenBy.lastname,
      full_name: `${data.givenBy.name} ${data.givenBy.lastname}`
    } : {},
    serial: data.serial
  })
});

if (!document.value && errorDocument.value) {
  throw createError({
    statusCode: 404,
    message: 'Documento no encontrado'
  });
}

const queryAssistant: Ref<string> = ref('');
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
      full_name: `${assistant.name} ${assistant.lastname}`,
      name: assistant.name,
      lastname: assistant.lastname,
      document: assistant.document
    }))
  }
});

const editingDocumentState = computed(() => ({
  kind: document.value?.kind,
  prefix: document.value?.prefix,
  givenBy: document.value?.givenBy,
  serial: document.value?.serial
}));


const onUpdateDocument = async () => {
  if (!confirm('¿Estás seguro de editar este documento?')) return;
  try {
    isLoadingEditingDocument.value = true;
    await $api(`/document/${route.params.id}`, {
      method: 'PUT',
      body: {
        kind: document.value?.kind,
        prefix: document.value?.prefix,
        givenBy: {
          _id: document.value?.givenBy?._id,
          name: document.value?.givenBy?.name,
          lastname: document.value?.givenBy?.lastname,
        },
        serial: document.value?.serial
      }
    });
    isLoadingEditingDocument.value = false;
    toast.add({
      title: '¡Listo!',
      description: 'Documento editado correctamente',
      color: 'green'
    });
    await router.push('/pre/documents');
  } catch (e: unknown | any) {
    isLoadingEditingDocument.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error al editar el documento',
      color: 'red'
    })
  }
}

const onSearchAssistants = async (query: string) => {
  queryAssistant.value = query;
  await FetchAssistants();
  return assistants.value;
}
</script>

<template>
  <UContainer>
    <AppNavHeader
        :back="route.query.redirect || '/pre/documents'"
        title="Editar papeleria"
        confirm
    />
    <UForm
        v-if="document"
        :schema="editingDocumentSchema"
        :state="editingDocumentState"
        @submit="onUpdateDocument"
        class="max-w-screen-sm space-y-4 mx-auto"
    >
      <UCard>
        <article class="space-y-4">
          <UFormGroup
              label="Tipo de documento"
              name="kind"
              required>
            <USelect
                v-model="document.kind"
                required
                placeholder="Seleccione un tipo"
                :options="documentOptions"
            />
          </UFormGroup>

          <UFormGroup
              label="Prefijo"
              name="prefix"
              help="El prefijo del documento puede ser opcional"
          >
            <UInput
                v-model="document.prefix"
                placeholder="Prefijo"
            />
          </UFormGroup>

          <UFormGroup
              label="Serial"
              name="serial"
              required>
            <UInput
                v-model="document.serial"
                required
                placeholder="Serial"
            />
          </UFormGroup>

          <UFormGroup
              label="Asesor"
              name="givenBy"
              required
          >
            <USelectMenu
                searchable-placeholder="Buscar titular o escribe para crear uno nuevo"
                :searchable="onSearchAssistants as any"
                v-model="document.givenBy"
                required
                placeholder="Seleccione un titular"
                :options="assistants || []"
                by="_id"
                option-attribute="full_name"
            />
          </UFormGroup>
        </article>
      </UCard>


      <UButton
          :loading="isLoadingEditingDocument"
          :disabled="isLoadingEditingDocument"
          type="submit"
          block>
        Editar documento
      </UButton>
    </UForm>
  </UContainer>
</template>

<style scoped>

</style>
