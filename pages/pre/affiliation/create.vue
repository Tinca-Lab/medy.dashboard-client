<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";

definePageMeta({
  auth: true,
  layout: 'pre',
  role: ['ADMIN']
})

const toast = useToast();
const {$api} = useNuxtApp();
const router = useRouter();

const creatingAffiliationSchema = z.object({
  patient: z.string({
    message: 'Titular inválido'
  }),
  status: z.string({
    message: 'Estado inválido'
  }),
  contract: z.string({
    message: 'Contrato inválido'
  }),
  subscription: z.string({
    message: 'Suscripción inválida'
  }),
});
const affiliationStatus = [
  {
    label: 'Activo',
    value: 'ACTIVE'
  },
  {
    label: 'Inactivo',
    value: 'INACTIVE'
  },
  {
    label: 'Expirado',
    value: 'EXPIRED'
  },
  {
    label: 'Cancelado',
    value: 'CANCELED'
  },
  {
    label: 'Pendiente',
    value: 'PENDING'
  },
]

// data
const isLoadingCreatingAffiliation: Ref<boolean> = ref(false);


const queryPatient: Ref<string> = ref('');
const queryContract: Ref<string> = ref('');

const payload: Ref<{
  patientId: string;
  subscriptionId: string;
  status: string;
  contract: string;
  logs?: { key: string, value: string }[]
}> = ref({
  patientId: '',
  subscriptionId: '',
  status: '',
  contract: '',
  logs: []
});


const {data: patients, refresh: onFetchPatients} = await useApi<any[]>('/patients', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
    filters: {
      $or: [
        {
          name: {
            $regex: queryPatient,
            $options: 'i'
          }
        },
        {
          lastname: {
            $regex: queryPatient,
            $options: 'i'
          }
        },
        {
          document: {
            $regex: queryPatient,
            $options: 'i'
          }
        }
      ],
    }
  },
  transform: (data) => {
    return data.map((patient) => ({
      _id: patient._id,
      name: `${patient.name} ${patient.lastname}`,
      email: patient.email,
      document: patient.document,
    }))
  }
})

const {data: contracts, refresh: FetchContracts} = await useApi<any[]>('/document', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'serial',
    sort: 'desc',
    filters: {
      serial: {
        $regex: queryContract,
        $options: 'i'
      },
      givenBy: {
        $ne: null
      },
      kind: 'CONTRACT'
    }
  },
  transform: (data) => {
    return data.map((contract) => ({
      _id: contract._id,
      serial: contract.serial,
      prefix: contract.prefix,
      full_serial: `${contract.prefix}${contract.serial}`,
    }))
  }
})

const {data: subscriptions} = await useApi<any[]>('/subscriptions', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
    filters: {}
  },
  transform: (data) => {
    return data.map((subscription) => ({
      _id: subscription._id,
      name: subscription.name,
      description: subscription.description,
    }))
  }
})


// computed
const creatingAffiliationState = computed(() => ({
  patient: payload.value.patientId,
  subscription: payload.value.subscriptionId,
  status: payload.value.status,
  contract: payload.value.contract
}));

// methods
const onSearchPatients = async (q: string) => {
  queryPatient.value = q;
  await onFetchPatients();
  return patients.value;
}

const onSearchContracts = async (q: string) => {
  queryContract.value = q;
  await FetchContracts();
  return contracts.value;
}
const onCreateAffiliation = async () => {
  isLoadingCreatingAffiliation.value = true;
  try {
    await $api('/affiliation', {
      method: 'POST',
      body: {
        patientId: payload.value.patientId,
        subscriptionId: payload.value.subscriptionId,
        status: payload.value.status,
        contract: payload.value.contract,
        logs: payload.value.logs
      }
    });
    await router.push('/pre/affiliation');
    toast.add({
      title: '¡Listo!',
      description: 'Afiliacion creada correctamente',
      color: 'green'
    })
    payload.value = {
      patientId: '',
      subscriptionId: '',
      status: '',
      contract: '',
      logs: []
    }
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error inesperado al crear los documentos',
      color: 'red'
    });
  } finally {
    isLoadingCreatingAffiliation.value = false;
  }
}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Crear afiliación" back="/pre/affiliation" confirm/>
    <UForm
        :schema="creatingAffiliationSchema"
        :state="creatingAffiliationState"
        class="max-w-screen-sm mx-auto space-y-4"
        @submit="onCreateAffiliation">

      <UCard>
        <article class="space-y-4">
          <UFormGroup
              label="Titular"
              name="patient"
              required>
            <USelectMenu
                creatable
                show-create-option-when="always"
                searchable-placeholder="Buscar titular o escribe para crear uno nuevo"
                :searchable="onSearchPatients as any"
                v-model="payload.patientId"
                required
                placeholder="Seleccione un titular"
                :options="patients || []"
                option-attribute="name"
                value-attribute="_id"
            >
              <template #option-empty>
                <UButton
                    to="/patients/create?redirect=/pre/affiliation/create"
                    variant="outline"
                    size="sm"
                >
                  Crear titular
                </UButton>
              </template>
              <template #option-create>
                <UButton
                    to="/patients/create?redirect=/pre/affiliation/create"
                    variant="outline"
                    size="sm"
                >
                  Crear titular
                </UButton>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup
              label="Tipo de afiliacion"
              name="subscription"
              required>
            <USelectMenu
                v-model="payload.subscriptionId"
                required
                placeholder="Seleccione un tipo de afiliacion"
                option-attribute="name"
                value-attribute="_id"
                :options="subscriptions || []"
            />
          </UFormGroup>

          <UFormGroup
              label="Contrato"
              name="contract"
              required>
            <USelectMenu
                searchable-placeholder="Buscar contratos asignados"
                :searchable="onSearchContracts as any"
                :options="contracts || []"
                v-model="payload.contract"
                option-attribute="full_serial"
                value-attribute="_id"
                required
                placeholder="Seleccione un contrato"
            />
          </UFormGroup>

          <UFormGroup
              label="Estado"
              name="kind"
              required>
            <USelect
                v-model="payload.status"
                required
                placeholder="Seleccione un tipo"
                option-attribute="label"
                value-attribute="value"
                :options="affiliationStatus"
            />
          </UFormGroup>

          <article
              v-for="(_, i) in payload.logs"
          >
            <UFormGroup
                v-if="payload.logs"
                :label="`Observacion ${i + 1}`"
                :name="'logs.' + i"
            >
              <UTextarea
                  v-model="payload.logs[i].value"
                  placeholder="eg. El titular tiene una deuda"
              />
              <UButton
                  class="mt-2"
                  icon="i-heroicons-trash"
                  size="sm"
                  variant="outline"
                  @click="payload.logs?.splice(i, 1)"
                  type="button"/>
            </UFormGroup>
          </article>
          <UButton
              size="sm"
              variant="outline"
              @click="payload.logs?.push({ key: 'note', value: '' })"
              type="button"
          >
            Agregar observacion
          </UButton>
        </article>
      </UCard>
      <UButton
          :loading="isLoadingCreatingAffiliation"
          :disabled="isLoadingCreatingAffiliation"
          type="submit" block>
        Crear afiliación
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
