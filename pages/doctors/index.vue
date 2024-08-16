<script setup lang="ts">
import type {Ref} from "vue";
import dayjs from "dayjs";

useHead({
  title: 'Especialistas',
})

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

const {$api} = useNuxtApp();
const toast = useToast();

// non reactive data
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


// data
const queryDoctor: Ref<string> = ref('');
const isLoadingDeletingDoctor = ref(false);

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

const {data: doctors, pending: isLoadingDoctors, refresh: FetchDoctors} = await useApi<any[]>('/doctors', {
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
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryDoctor,
            $options: 'i',
          }
        }
      ]
    }
  },
  transform: (data) => {
    return data.map((doctor) => ({
      _id: doctor._id,
      name: `${doctor.name} ${doctor.lastname}`,
      email: doctor.email || 'N/A',
      createdAt: dayjs(doctor.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(doctor.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
})

const {data: count, refresh: FetchCount} = await useApi<number>('/doctors/count', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {
      $or: [
        {
          name: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryDoctor,
            $options: 'i',
          }
        }
      ]
    }
  },
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

const onDeleteDoctor = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer')) {
    return;
  }
  try {
    isLoadingDeletingDoctor.value = true;
    await $api(`/doctors/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: '¡Listo!',
      description: 'El profesional ha sido eliminado exitosamente',
      color: 'green'
    })
    isLoadingDeletingDoctor.value = false;
    await FetchDoctors();
    await FetchCount();
  } catch (e: unknown | any) {
    isLoadingDeletingDoctor.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al eliminar el usuario',
      color: 'red'
    })
  }
};
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          label="Buscar doctor"
          required
      >
        <UInput
            placeholder="Buscar doctor"
            v-model="queryDoctor"
        />
      </UFormGroup>
      <UButton
          to="/doctors/create"
          trailing-icon="i-heroicons-plus">
        Crear doctor
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingDoctors"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="doctors || []"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay doctores</p>
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
              size="sm"
              title="Editar especialista"
              variant="ghost"
              :to="`/doctors/${row._id}`"
              trailing-icon="i-heroicons-pencil"
          />
          <UButton
              size="sm"
              color="red"
              title="Eliminar especialista"
              @click="onDeleteDoctor(row._id)"
              trailing-icon="i-heroicons-trash"
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
