<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import dayjs from "dayjs";
import type {Patient} from "~/types/patient";
import {FetchError} from "ofetch";

useHead({
  title: 'Inicio',
})

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

// composable
const {$api} = useNuxtApp();
const {user} = useAuth();
const toast = useToast();

useHead({
  title: 'Pacientes',
})

// non reactive data
const userKindOptions = [
  {
    label: 'Paciente',
    value: UserType.USER,
  },
  {
    label: 'Médico',
    value: UserType.DOCTOR,
  },
  {
    label: 'Asesor',
    value: UserType.ASSISTANT,
  },
  {
    label: 'Auxiliar',
    value: UserType.MANAGER,
  },
  {
    label: 'Administrador',
    value: UserType.ADMIN,
  }
];

const columns = [
  {
    label: 'Nombre',
    key: 'name',
  },
  {
    label: 'Apellido',
    key: 'lastname',
  },
  {
    label: 'Tipo de documento',
    key: 'type_document',
  },
  {
    label: 'Documento',
    key: 'document',
  },
  {
    label: 'Correo electrónico',
    key: 'email',
  },
  {
    label: 'Celular',
    key: 'phone',
  },
  {
    label: 'Creado en',
    key: 'createdAt',
    sortable: true,
  },
  {
    label: 'Última actualización',
    key: 'updatedAt',
    sortable: true,
  },
  {
    label: 'Acciones',
    key: 'actions',
  },
];


const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

const query: Ref<string | undefined> = ref('');


const {data, status, refresh} = await useAsyncData('patients', async () => {
  const [patients, count] = await Promise.all([
    $api('/patients', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        sort: sort.value,
        filters: {
          or: [
            {
              name: {
                regex: query.value,
              }
            },
            {
              lastname: {
                regex: query.value,
              }
            },
            {
              document: {
                regex: query.value,
              }
            },
            {
              email: {
                regex: query.value,
              }
            },
            {
              phone: {
                regex: query.value,
              }
            }
          ]
        }
      }
    }),
    $api('/patients/count', {
      params: {
        filters: {
          or: [
            {
              name: {
                regex: query.value,
              }
            },
            {
              lastname: {
                regex: query.value,
              }
            },
            {
              document: {
                regex: query.value,
              }
            },
            {
              email: {
                regex: query.value,
              }
            },
            {
              phone: {
                regex: query.value,
              }
            }
          ]
        }
      }
    })
  ])

  return {patients, count}
}, {
  server: true,
  watch: [page, pageSize, sortBy, sort, query],
  default: () => ({
    patients: [],
    count: 0,
  }),
  transform: (data: { patients: Patient[], count: string }) => ({
    patients: data.patients?.map((patient: Patient) => ({
      _id: patient._id,
      name: patient.name,
      lastname: patient.lastname,
      type_document: patient.typeDocument,
      document: patient.document,
      email: patient.email ?? 'NO REGISTRADO',
      phone: patient.phone ?? 'NO REGISTRADO',
      createdAt: dayjs(patient.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(patient.updatedAt).format('MMM D, YYYY h:mm A'),
    })),
    count: Number(data.count),
  })
})

const onDeletePatient = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer')) {
    return;
  }
  try {
    await $api(`/patients/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: '¡Listo!',
      description: 'El paciente ha sido eliminado exitosamente',
      color: 'green'
    })
  } catch (e) {
    toast.add({
      title: '¡Ups!',
      description: (e as FetchError).data.message || 'Ocurrió un error desconocido al eliminar el paciente',
      color: 'red'
    })
  } finally {
    await refresh();
  }
}
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          label="Buscar paciente"
          required
      >
        <UInput
            placeholder="Buscar paciente"
            v-model="query"
        />
      </UFormGroup>
      <UButton
          to="/patients/create"
          trailing-icon="i-heroicons-plus">
        Crear paciente
      </UButton>
    </nav>
    <UTable
        :loading="status  === 'pending'"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="data?.patients"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay pacientes</p>
        </div>
      </template>
      <template #loading-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin h-8 w-8 text-primary"/>
        </div>
      </template>
      <template #actions-data="{row}">
        <article class="space-x-2">
          <UButton
              @click="() => $router.push(`/patients/${row._id}`)"
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
          />
          <UButton
              @click="onDeletePatient(row._id)"
              size="sm"
              color="red"
              icon="i-heroicons-trash"
          />
        </article>
      </template>
    </UTable>

    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="data?.count"
    />
  </div>
</template>

<style scoped>

</style>
