<script setup lang="ts">
import {z} from "zod";
import dayjs from "dayjs";

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

const {$api} = useNuxtApp();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const {data: appointment, error: errorAppointment} = useApi<any>(`/appointments/${route.params.id}`, {
  method: 'GET',
  transform: (appointment) => ({
    date: dayjs(appointment.date).format('YYYY-MM-DDTHH:mm'),
    place: appointment.place,
    patient: {
      _id: appointment.patient._id,
      name: appointment.patient.name,
      lastname: appointment.patient.lastname,
      full_name: `${appointment.patient.name} ${appointment.patient.lastname}`,
    },
    service: {
      _id: appointment.service._id,
      name: appointment.service.name,
    },
    doctor: {
      _id: appointment.doctor._id,
      name: appointment.doctor.name,
      lastname: appointment.doctor.lastname,
      full_name: `${appointment.doctor.name} ${appointment.doctor.lastname}`,
    },
    notes: appointment.notes,
  }),
});

if (!appointment.value && errorAppointment.value) {
  throw createError({
    statusCode: 404,
    message: 'Cita médica no encontrada',
  });
}

const editAppointmentSchema = z.object({
  date: z.string({
    message: 'La fecha de la cita médica es inválida',
  }),
  patient: z.object({
    _id: z.string(),
    name: z.string(),
    lastname: z.string(),
  }),
  service: z.object({
    _id: z.string(),
    name: z.string(),
  }),
  doctor: z.object({
    _id: z.string(),
    name: z.string(),
    lastname: z.string(),
  }),
  notes: z.string().optional(),
  place: z.string({
    message: 'El lugar de la cita médica es requerido',
  }),
});


const isCreating = ref(false);


const serviceQuery = ref('');
const patientQuery = ref('');

const doctors = ref([]);

const {data: services, pending: isLoadingServices, refresh: onFetchServices} = await useApi<any[]>('/services', {
  method: 'GET',
  server: false,
  lazy: true,
  transform: (data) => {
    return data.map((service) => ({
      _id: service._id,
      name: service.name,
      doctors: service.doctors.map((doctor: any) => ({
        _id: doctor._id,
        full_name: `${doctor.name} ${doctor.lastname}`,
        name: doctor.name,
        lastname: doctor.lastname,
      })),
    }));
  },
  params: {
    filters: {
      name: {
        $regex: serviceQuery,
        $options: 'i',
      },
    },
  },
});

const {data: patients, pending: isLoadingPatients, refresh: onFetchPatients} = await useApi<any[]>('/patients', {
  method: 'GET',
  server: false,
  lazy: true,
  transform: (data) => {
    return data.map((patient) => ({
      _id: patient._id,
      name: patient.name,
      lastname: patient.lastname,
      full_name: `${patient.name} ${patient.lastname}`,
    }));
  },
  params: {
    filters: {
      $or: [
        {
          name: {
            $regex: patientQuery,
            $options: 'i',
          },
        },
        {
          lastname: {
            $regex: patientQuery,
            $options: 'i',
          },
        },
        {
          document: {
            $regex: patientQuery,
            $options: 'i',
          },
        },
      ],
    },
  },
});

const onSearchPatients = async (query: string) => {
  patientQuery.value = query;
  await onFetchPatients();
  return patients.value;
};

const onSearchServices = async (query: string) => {
  serviceQuery.value = query;
  await onFetchServices();
  return services.value;
};

const editAppointmentState = computed(() => ({
  date: appointment.value?.date,
  patient: appointment.value?.patient,
  service: appointment.value?.service,
  doctor: appointment.value?.doctor,
  notes: appointment.value?.notes,
  place: appointment.value?.place,
}));

const onSubmit = async () => {
  if (!confirm('¿Estás seguro de actualizar esta cita médica?')) return;
  isCreating.value = true;
  try {
    await $api(`/appointments/${route.params.id}`, {
      method: 'PUT',
      body: {
        date: new Date(appointment.value?.date).toISOString(),
        notes: appointment.value?.notes || undefined,
        place: appointment.value?.place.toUpperCase(),
        service: {
          _id: appointment.value?.service._id,
          name: appointment.value?.service.name,
        },
        patient: {
          _id: appointment.value?.patient._id,
          name: appointment.value?.patient.name,
          lastname: appointment.value?.patient.lastname,
        },
        doctor: {
          _id: appointment.value?.doctor._id,
          name: appointment.value?.doctor.name,
          lastname: appointment.value?.doctor.lastname,
        },
      },
    });
    toast.add({
      title: '¡Listo!',
      description: 'La cita médica ha sido actualizada exitosamente',
      color: 'green',
    });
    await router.push('/appointments');
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al actualizar la cita médica',
      color: 'red',
    });
  } finally {
    isCreating.value = false;
  }
};

// watch
watch([appointment, services], () => {
  if (!appointment.value?.service) return;
  if (!services.value) return;
  doctors.value = services.value?.find((service) => service._id === appointment.value?.service._id)?.doctors || [];
}, {
  deep: true,
  immediate: true,
})
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader
        title="Editar cita médica"
        back="/appointments"
        confirm
    />
    <UForm
        v-if="appointment"
        @submit="onSubmit"
        :state="editAppointmentState"
        :schema="editAppointmentSchema"
        class="max-w-screen-sm mx-auto space-y-4"
    >

      <UCard>
        <article class="grid grid-cols-1 gap-4">
          <UFormGroup
              label="¿Para quién?"
              required
              name="patient"
          >
            <USelectMenu
                searchable-placeholder="eg. 49331098"
                :searchable="onSearchPatients as any"
                placeholder="Selecciona un paciente"
                :model-value="appointment?.patient"
                @update:model-value="appointment.patient = $event"
                :options="patients || []"
                :loading="isLoadingPatients"
                by="_id"
                option-attribute="full_name"
                required
            />
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
                :model-value="appointment?.service"
                @update:model-value="appointment.service = $event"
                :options="services || []"
                :loading="isLoadingServices"
                option-attribute="name"
                by="_id"
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
                creatable
                placeholder="Selecciona un doctor"
                :model-value="appointment.doctor"
                @update:model-value="appointment.doctor = $event"
                :options="doctors || []"
                option-attribute="full_name"
                by="_id"
                required>
              <template #option-create>
                <UButton
                    :title="!appointment.service ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!appointment.service"
                    :to="`/doctors/create?redirect=/services/${appointment.service._id},/appointments/${route.params.id}`"
                    size="sm"
                    variant="outline"
                    class="disabled:cursor-not-allowed"
                >
                  Crear doctor
                </UButton>
              </template>
              <template #option-empty>
                <UButton
                    :title="!appointment.service ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!appointment.service"
                    :to="`/doctors/create?redirect=/services/${appointment.service._id},/appointments/${route.params.id}`"
                    size="sm"
                    variant="outline"
                    class="disabled:cursor-not-allowed"
                >
                  Crear doctor
                </UButton>
              </template>
              <template #empty>
                <UButton
                    :title="!appointment.service ? 'Selecciona un servicio' : 'Crear doctor'"
                    :disabled="!appointment.service"
                    :to="`/doctors/create?redirect=/services/${appointment.service._id},/appointments/${route.params.id}`"
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
                v-model="appointment.date"
                label="Fecha de la cita"
                required/>
          </UFormGroup>

          <UFormGroup
              required
              name="place"
              label="¿Dónde?"
          >
            <UInput
                input-class="uppercase"
                v-model="appointment.place"
                placeholder="eg. Hospital, Clínica, Consultorio"
                required/>
          </UFormGroup>

          <UFormGroup
              label="Notas"
              name="notes"
          >
            <UTextarea
                v-model="appointment.notes"
                :maxrows="5"
            />
          </UFormGroup>
        </article>
      </UCard>


      <UButton type="submit" class="col-span-full" block>
        Editar cita médica
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
