<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import dayjs from "dayjs";

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
  },];
const columns = [
  {
    label: 'Nombre',
    key: 'name',
  },
  {
    label: 'Correo electrónico',
    key: 'email',
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

const queryPatient: Ref<string> = ref('');

const {data: patients, pending: isLoadingPatients, refresh: onFetchPatients} = await useApi<any[]>('/patients', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort],
  params: {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sort: sort.value,
    filters: {
      $or: [
        {
          name: {
            $regex: queryPatient,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryPatient,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryPatient,
            $options: 'i',
          }
        }
      ]
    }
  },
  default: () => [],
  watch: [queryPatient],
  transform: (data) => {
    return data.map((patient) => ({
      _id: patient._id,
      name: `${patient.name} ${patient.lastname}`,
      email: patient.email,
      createdAt: dayjs(patient.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(patient.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
})

const {data: count, refresh: onFetchCount} = await useApi<number>('/patients/count', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {
      $or: [
        {
          name: {
            $regex: queryPatient,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryPatient,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryPatient,
            $options: 'i',
          }
        }
      ]
    }
  },
  watch: [queryPatient],
  default: () => 0,
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

const onDeletePatient = async (id: string) => {
  try {
    await $api(`/patients/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: '¡Listo!',
      description: 'El paciente ha sido eliminado exitosamente',
      color: 'green'
    })
  } catch (e: unknown | any) {

    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al eliminar el paciente',
      color: 'red'
    })
  } finally {
    await onFetchPatients();
    await onFetchCount();
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
            v-model="queryPatient"
        />
      </UFormGroup>
      <UButton
          to="/patients/create"
          trailing-icon="i-heroicons-plus">
        Crear paciente
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingPatients"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="patients || []"
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
        :total="count || 0"
    />
  </div>
</template>

<style scoped>

</style>
