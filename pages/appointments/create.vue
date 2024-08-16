<script setup lang="ts">
import {z} from "zod";

definePageMeta({
  auth: true,
  layout: 'pre',
})


// composable
const {$api} = useNuxtApp();
const {user} = useAuth();
const toast = useToast();
const router = useRouter();

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
    message: 'El profesional es requerido',
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
  transform: (data) => {
    return data.map((patient) => ({
      _id: patient._id,
      full_name: `${patient.name} ${patient.lastname}`,
      document: patient.document,
    }))
  }
})

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
    isCreating.value = false;
    createAppointment.value = {
      doctorId: '',
      patientId: '',
      date: '',
      serviceId: '',
      notes: '',
    }
    await router.push('/appointments');
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
  <section class="space-y-4">
    <AppNavHeader
        title="Crear cita médica"
        back="/appointments"
        confirm
    />
    <UForm
        @submit="onSubmit"
        :state="createAppointmentState"
        :schema="createAppointmentSchema"
        class="max-w-screen-sm mx-auto space-y-4"
    >

      <UCard>
        <article class="grid grid-cols-1 gap-4">
          <UFormGroup
              label="¿Para quién?"
              required
              name="patientId"
          >
            <USelectMenu
                searchable-placeholder="eg. 49331098"
                :searchable="onSearchPatients as any"
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
                :searchable="onSearchServices as any"
                placeholder="Selecciona un servicio"
                v-model="createAppointment.serviceId"
                :options="services || []"
                :loading="isLoadingServices"
                option-attribute="name"
                value-attribute="_id"
                required/>

          </UFormGroup>

          <UFormGroup
              label="¿Qué doctor?"
              name="doctorId"
              required
              help="Si el profesional no aparece en la lista, puedes crearlo desde aquí seleccionando un servicio antes"
          >
            <USelectMenu
                show-create-option-when="always"
                searchable-placeholder="Buscar un profesional  nombre o escribe para crear uno"
                searchable
                creatable
                placeholder="Selecciona un doctor"
                v-model="createAppointment.doctorId"
                label="Doctor"
                :options="doctors || []"
                option-attribute="full_name"
                value-attribute="_id"
                required>
              <template #option-create>
                <UButton
                    :title="!createAppointment.serviceId ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!createAppointment.serviceId"
                    :to="`/doctors/create?redirect=/services/${createAppointment.serviceId},/appointments/create`"
                    size="sm"
                    variant="outline"
                    class="disabled:cursor-not-allowed"
                >
                  Crear doctor
                </UButton>
              </template>
              <template #option-empty>
                <UButton
                    :title="!createAppointment.serviceId ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!createAppointment.serviceId"
                    :to="`/doctors/create?redirect=/services/${createAppointment.serviceId},/appointments/create`"
                    size="sm"
                    variant="outline"
                    class="disabled:cursor-not-allowed"
                >
                  Crear doctor
                </UButton>
              </template>
              <template #empty>
                <UButton
                    :title="!createAppointment.serviceId ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!createAppointment.serviceId"
                    :to="`/doctors/create?redirect=/services/${createAppointment.serviceId},/appointments/create`"
                    size="sm"
                    variant="outline"
                    class="disabled:cursor-not-allowed"
                >
                  Crear doctor
                </UButton>
              </template>
            </USelectMenu>

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
        </article>
      </UCard>


      <UButton type="submit" class="col-span-full" block>
        Crear cita médica
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
