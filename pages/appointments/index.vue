<script setup lang="ts">
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

const createAppointmentSchema = z.object({
  date: z.string({
    message: 'La fecha de la cita médica es inválida',
  }),
  patientId: z.string({
    message: 'El paciente es requerido',
  }),
  serviceId: z.string({
    message: 'El servicio es requerido',
  }),
  doctorId: z.string({
    message: 'El doctor es requerido',
  }),
  notes: z.string().optional(),
});

// data
const createAppointment = ref<{
  doctorId: string;
  patientId: string;
  date: string;
  serviceId: string;
  notes: string;
}>({
  doctorId: '',
  patientId: '',
  date: '',
  serviceId: '',
  notes: '',
});
const isCreating = ref(false);

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('desc')

const serviceQuery = ref('');
const patientQuery = ref('');

const doctors = ref([]);

const {data: services, pending: isLoadingServices, refresh: onFetchServices} = await useApi<any[]>('/services', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {
      name: {
        $regex: serviceQuery,
        $options: 'i'
      }
    },
  },
  default: () => [],
  transform: (data) => {
    return data.map((service) => ({
      _id: service._id,
      name: service.name,
      doctors: service.doctors.map((doctor) => ({
        _id: doctor._id,
        full_name: `${doctor.name} ${doctor.lastname}`,
      }))
    }))
  }
})

const {data: patients, pending: isLoadingPatients, refresh: onFetchPatients} = await useApi<any[]>('/patients', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'asc',
    filters: {
      document: {
        $regex: patientQuery,
        $options: 'i'
      }
    },
  },
  default: () => [],
  transform: (data) => {
    return data.map((patient) => ({
      _id: patient._id,
      full_name: `${patient.name} ${patient.lastname}`,
      document: patient.document,
    }))
  }
})

const {
  data: appointments,
  pending: isLoadingAppointments,
  refresh: onFetchAppointments
} = await useApi<any[]>('/appointments', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort],
  params: {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sort: sort.value,
    filters: {}
  },
  default: () => [],
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

const {data: count, refresh: onFetchCount} = await useApi<number>('/appointments/count', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {}
  },
  default: () => 0,
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

// methods
const onSubmit = async () => {
  try {
    await $api('/appointments', {
      method: 'POST',
      body: {
        ...createAppointment.value,
        date: new Date(createAppointment.value.date).toISOString(),
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'La cita médica ha sido creado exitosamente',
      color: 'green'
    })
    onFetchAppointments();
    onFetchCount();
    isCreating.value = false;
    createAppointment.value = {
      doctorId: '',
      patientId: '',
      date: '',
      serviceId: '',
      notes: '',
    }
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al crear la cita médica',
      color: 'red'
    })
  }
}

const onSearchServices = async (query: string) => {
  serviceQuery.value = query;
  await onFetchServices();
  return services.value;
}

const onSearchPatients = async (query: string) => {
  patientQuery.value = query;
  await onFetchPatients();
  return patients.value;
}

// computed
const createAppointmentState = computed(() => ({
  date: createAppointment.value.date,
  patientId: createAppointment.value.patientId,
  serviceId: createAppointment.value.serviceId,
  doctorId: createAppointment.value.doctorId,
  notes: createAppointment.value.notes,
}))

// watch
watch(createAppointment, () => {
  if (!createAppointment.value.serviceId) return;
  if (!services.value) return;

  const service = services.value.find((service) => service._id === createAppointment.value.serviceId);
  if (!service) return;

  doctors.value = service.doctors;

}, {
  deep: true,
})
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <div></div>
      <UButton
          @click="isCreating=!isCreating"
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
              :state="createAppointmentState"
              :schema="createAppointmentSchema"
              class="grid grid-cols-1 gap-4">

            <UFormGroup
                label="¿Para quién?"
                required
                name="patientId"
            >
              <USelectMenu
                  searchable-placeholder="eg. 49331098"
                  :searchable="onSearchPatients"
                  placeholder="Selecciona un paciente"
                  v-model="createAppointment.patientId"
                  :options="patients || []"
                  :loading="isLoadingPatients"
                  option-attribute="full_name"
                  value-attribute="_id"
                  required/>
            </UFormGroup>

            <UFormGroup
                label="¿Qué servicio?"
                required
                name="serviceId"
            >
              <USelectMenu
                  searchable-placeholder="Buscar un servicio"
                  :searchable="onSearchServices"
                  placeholder="Selecciona un servicio"
                  v-model="createAppointment.serviceId"
                  :options="services || []"
                  :loading="isLoadingServices"
                  option-attribute="name"
                  value-attribute="_id"
                  by="_id"
                  required/>

            </UFormGroup>

            <UFormGroup
                label="¿Qué doctor?"
                name="doctorId"
                required
            >
              <USelectMenu
                  searchable-placeholder="Buscar un doctor"
                  :searchable="true"
                  placeholder="Selecciona un doctor"
                  v-model="createAppointment.doctorId"
                  label="Doctor"
                  :options="doctors || []"
                  option-attribute="full_name"
                  value-attribute="_id"
                  required/>

            </UFormGroup>

            <UFormGroup
                label="¿Cuándo?"
                name="date"
                required
            >
              <UInput
                  type="datetime-local"
                  v-model="createAppointment.date"
                  label="Fecha de la cita"
                  required/>
            </UFormGroup>

            <UFormGroup
                label="Notas"
                name="notes"
            >
              <UTextarea
                  v-model="createAppointment.notes"
                  :maxrows="5"
              />
            </UFormGroup>

            <UButton type="submit" class="col-span-full" block>
              Crear cita
            </UButton>
          </UForm>
        </UContainer>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
