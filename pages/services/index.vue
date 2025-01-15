<script setup lang="ts">
import type {Ref} from "vue";
import dayjs from "dayjs";
import type {Doctor} from "~/types/doctors";
import type {Service} from "~/types/service";
import {FetchError} from "ofetch";

useHead({
  title: 'Citas médicas',
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
  title: 'Catálogo',
})

// non reactive data
const columns = [
  {
    label: 'Nombre',
    key: 'name',
  },
  {
    label: 'Precio',
    key: 'price',
  },
  {
    label: 'Descuento',
    key: 'discount',
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

const query: Ref<string> = ref('');
const isLoadingDeletingService: Ref<boolean> = ref(false);


const {data, status} = await useAsyncData('services', async () => {
  const [services, count] = await Promise.all([
    $api('/services', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        sortBy: sortBy.value,
        sort: sort.value,
        filters: {
          name: {
            regex: query.value,
          }
        },
      }
    }),
    $api('/services/count', {
      params: {
        filters: {
          name: {
            regex: query.value,
          }
        },
      }
    }),
  ])

  return {services, count}
}, {
  server: true,
  watch: [page, pageSize, sortBy, sort, query],
  default: () => ({
    services: [],
    count: 0,
  }),
  transform: (data: { services: Service[], count: string }) => ({
    services: data.services?.map((service: Service) => ({
      _id: service._id,
      name: service.name,
      price: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(service.price),
      discount: service.discount,
      createdAt: dayjs(service.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(service.updatedAt).format('MMM D, YYYY h:mm A'),
    })),
    count: Number(data.count),
  })
})


// methods
const onDeleteService = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer')) {
    return;
  }
  isLoadingDeletingService.value = true;
  try {
    await $api(`/services/${id}`, {
      method: 'DELETE',
    });
    toast.add({
      title: '¡Listo!',
      description: 'El servicio ha sido eliminado correctamente',
      color: 'green',
    });
  } catch (e) {
    toast.add({
      title: '¡Ups!',
      description: (e as FetchError).data.message || 'Ha ocurrido un error al eliminar el servicio',
      color: 'red',
    });
  } finally {
    isLoadingDeletingService.value = false;
  }
}
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          required
          label="Buscar servicios"
      >
        <UInput
            v-model="query"
            placeholder="Buscar servicios"
        />
      </UFormGroup>
      <UButton
          to="/services/create"
          trailing-icon="i-heroicons-plus">
        Crear servicio
      </UButton>
    </nav>
    <UTable
        :loading="status === 'pending'"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="data.services"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay servicios</p>
        </div>
      </template>
      <template #loading-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin h-8 w-8 text-primary"/>
        </div>
      </template>
      <template #actions-data="{ row }">
        <article class="flex items-center gap-2">
          <UButton
              variant="ghost"
              :to="`/services/${row._id}`"
              size="sm"
              trailing-icon="i-heroicons-pencil"
          />
          <UButton
              @click="onDeleteService(row._id)"
              size="sm"
              color="red"
              trailing-icon="i-heroicons-trash"
          />
        </article>
      </template>
    </UTable>
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="data.count"
    />
  </div>
</template>

<style scoped>

</style>
