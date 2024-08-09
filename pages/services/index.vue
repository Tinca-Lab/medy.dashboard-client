<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import {z} from "zod";
import dayjs from "dayjs";

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

const createServiceSchema = z.object({
  name: z.string({
    message: 'El nombre no es válido'
  }),
  price: z.number({
    message: 'El precio no es válido'
  }),
  discount: z.number({
    message: 'El descuento no es válido'
  }).min(1).max(100).optional()
});

// data
const createService = ref<{
  name: string | undefined;
  doctorId: string | undefined;
  price: number | undefined;
  discount?: number | undefined;
}>({
  name: undefined,
  doctorId: undefined,
  price: undefined,
  discount: undefined,
});
const isCreating = ref(false);

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

const q = ref('');
const selectedDoctors = ref<any[]>([]);
const queryService: Ref<string> = ref('');

const {data: doctors, refresh: onFetchDoctors} = await useApi<any[]>('/doctors', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort],
  params: {
    filters: {
      name: {
        $regex: q,
        $options: 'i'
      }
    }
  },
  default: () => [],
  transform: (data) => {
    return data.map((doctor) => ({
      _id: doctor._id,
      full_name: `${doctor.name} ${doctor.lastname}`,
      name: doctor.name,
      lastname: doctor.lastname,
    }))
  },
})

const {data: services, pending: isLoadingServices, refresh: onFetchServices} = await useApi<any[]>('/services', {
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
      name: {
        $regex: queryService,
        $options: 'i'
      }
    }
  },
  default: () => [],
  transform: (data) => {
    return data.map((service) => ({
      _id: service._id,
      name: service.name,
      price: new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP'}).format(service.price),
      discount: service.discount,
      createdAt: dayjs(service.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(service.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
})

const {data: count, refresh: onFetchCount} = await useApi<number>('/services/count', {
  method: 'GET',
  server: false,
  lazy: true,
  default: () => 0,
  transform: (data) => Number(data),
  params: {
    filters: {
      name: {
        $regex: queryService,
        $options: 'i'
      }
    }
  }
});

const selected: Ref<any[]> = ref([]);

// methods
const onSubmit = async () => {
  try {
    await $api('/services', {
      method: 'POST',
      body: {
        name: createService.value.name,
        price: createService.value.price,
        discount: createService.value.discount,
        doctors: selectedDoctors.value,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El servicio ha sido creado exitosamente',
      color: 'green'
    })
    onFetchServices();
    onFetchCount();
    isCreating.value = false;
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al crear el servicio',
      color: 'red'
    })
  }
}

// computed
const createServiceState = computed(() => ({
  name: createService.value.name,
  price: createService.value.price,
  discount: createService.value.discount,
}))

// methods
const onSearchDoctors = async (search: string) => {
  q.value = search;
  await onFetchDoctors();
  return doctors.value;
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
            v-model="queryService"
            placeholder="Buscar servicios"
        />
      </UFormGroup>
      <UButton
          @click="isCreating=!isCreating"
          trailing-icon="i-heroicons-plus">
        Crear servicio
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingServices"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="services || []"
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
    </UTable>
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
    <!--    -->
    <Teleport to="body">
      <UModal v-model="isCreating">
        <UContainer>
          <UForm
              @submit="onSubmit"
              :state="createServiceState"
              :schema="createServiceSchema"
              class="grid grid-cols-2 gap-4">
            <UFormGroup
                class="col-span-full"
                label="Nombres" name="name" required>
              <UInput
                  required
                  type="text"
                  v-model="createService.name"
                  placeholder="eg. Odontología"
              />
            </UFormGroup>

            <UFormGroup
                class="col-span-full"
                label="Cósto del servicio" name="price" required>
              <UInput
                  :min="1"
                  required
                  type="number"
                  v-model="createService.price"
                  placeholder="eg. 100000"
              />
            </UFormGroup>

            <UFormGroup
                class="col-span-full"
                label="Descuento del servicio" name="discount">
              <UInput
                  :min="1"
                  :max="100"
                  type="number"
                  v-model="createService.discount"
                  placeholder="eg. 10"
              />
            </UFormGroup>

            <UFormGroup
                class="col-span-full"
                label="Especialista" name="doctorId" required
            >
              <USelectMenu
                  :multiple="true"
                  :searchable="onSearchDoctors"
                  searchable-placeholder="Buscar un especialista"
                  placeholder="Selecciona los especialistas"
                  :options="doctors || []"
                  option-attribute="full_name"
                  value-attribute="_id"
                  by="_id"
                  v-model="selectedDoctors"
              />
            </UFormGroup>

            <UButton type="submit" class="col-span-full" block>
              Crear servicio
            </UButton>
          </UForm>
        </UContainer>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
