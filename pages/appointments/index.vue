<script setup lang="ts">
import type {Ref} from "vue";
import dayjs from "dayjs";

useHead({
  title: 'Citas médicas',
})

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

// non reactive data
const columns = [
  {
    label: 'Servicio',
    key: 'service',
    sortable: true,
  },
  {
    label: 'Doctor',
    key: 'doctor',
    sortable: true,
  },
  {
    label: 'Paciente',
    key: 'patient',
    sortable: true,
  },
  {
    label: 'Fecha',
    key: 'date',
    sortable: true,
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

const {$api} = useNuxtApp();
const toast = useToast();


const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('desc')

const queryAppointment: Ref<string> = ref('');
const isLoadingDeletingAppointment: Ref<boolean> = ref(false);

const {
  data: appointments,
  pending: isLoadingAppointments,
  refresh: FetchAppointments,
} = await useApi<any[]>('/appointments', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort, queryAppointment],
  params: {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sort: sort.value,
    filters: {
      $or: [
        {
          'service.name': {
            $regex: queryAppointment,
            $options: 'i',
          }
        },
        {
          'doctor.name': {
            $regex: queryAppointment,
            $options: 'i',
          }
        },
        {
          'doctor.lastname': {
            $regex: queryAppointment,
            $options: 'i',
          }
        },
        {
          'patient.name': {
            $regex: queryAppointment,
            $options: 'i',
          }
        },
        {
          'patient.lastname': {
            $regex: queryAppointment,
            $options: 'i',
          }
        },
      ]
    }
  },
  transform: (data) => {
    return data.map((appointment) => ({
      _id: appointment._id,
      service: appointment.service.name,
      doctor: `${appointment.doctor.name} ${appointment.doctor.lastname}`,
      patient: `${appointment.patient.name} ${appointment.patient.lastname}`,
      date: dayjs(appointment.date).format('MMM D, YYYY h:mm A'),
      createdAt: dayjs(appointment.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(appointment.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
})

const {data: count, refresh: FetchCount} = await useApi<number>('/appointments/count', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {}
  },
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

const onDeleteAppointment = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar esta cita médica? Esta acción no se puede deshacer')) {
    return;
  }
  isLoadingDeletingAppointment.value = true;
  try {
    await $api(`/appointments/${id}`, {
      method: 'DELETE',
    });
    toast.add({
      title: '¡Listo!',
      description: 'La cita médica ha sido eliminada correctamente',
      color: 'green',
    });
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error al eliminar la cita médica',
      color: 'red',
    });
  } finally {
    await FetchAppointments();
    await FetchCount();
    isLoadingDeletingAppointment.value = false;
  }
}

</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          label="Buscar cita médica"
          required
      >
        <UInput
            placeholder="eg .: Dr. Juan Pérez o Paciente Juan Pérez o 10/10/2021 10:00 AM"
            v-model="queryAppointment"
        />
      </UFormGroup>
      <UButton
          to="/appointments/create"
          trailing-icon="i-heroicons-plus">
        Crear cita médica
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingAppointments"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="appointments || []"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay citas médicas</p>
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
              :to="`/appointments/${row._id}`"
              size="sm"
              icon="i-heroicons-pencil"
              variant="ghost"
          />
          <UButton
              @click="onDeleteAppointment(row._id)"
              size="sm"
              icon="i-heroicons-trash"
              color="red"
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
