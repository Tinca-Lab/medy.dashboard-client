<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";
import type {Patient} from "~/types/patient";
import {type Subscription, SubscriptionExpiration} from "~/types/subscription";
import type {Document} from "~/types/document";

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


const query = ref({
  patient: '',
  contract: ''
})

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

const {
  data: patients,
  refresh: onFetchPatients
} = await useAsyncData<Patient[]>('patients', () => $api('/patients', {
  method: 'GET',
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
  },
  query: {
    filters: {
      or: [
        {
          name: {
            regex: query.value.patient,
          }
        },
        {
          lastname: {
            regex: query.value.patient,
          }
        },
        {
          document: {
            regex: query.value.patient,
          }
        },
        {
          email: {
            regex: query.value.patient,
          }
        },
        {
          phone: {
            regex: query.value.patient,
          }
        }
      ]
    }
  },
}), {})

const {
  data: contracts,
  refresh: onFetchContracts
} = await useAsyncData<Document[]>('documents', () => $api('/document', {
  method: 'GET',
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'serial',
    sort: 'desc',
  },
  query: {
    filters: {
      serial: {
        regex: query.value.contract,
      },
      givenBy: {
        neq: null
      },
      kind: 'CONTRACT'
    }
  },
}), {})

const {data: subscriptions} = await useAsyncData<Subscription[]>('subscriptions', () => $api('/subscriptions', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
  },
}), {
  default: () => [],
  transform: (data: Subscription[]) => data.map((subscription) => ({
    _id: subscription._id,
    name: subscription.name,
    description: subscription.description,
    price: subscription.price,
    expiration: subscription.expiration,
  }))
}) as { data: Ref<Subscription[]> };


// computed
const creatingAffiliationState = computed(() => ({
  patient: payload.value.patientId,
  subscription: payload.value.subscriptionId,
  status: payload.value.status,
  contract: payload.value.contract
}));

// methods
async function onSearchPatients(q: string): Promise<Patient[] | null> {
  query.value.patient = q;
  await onFetchPatients();
  return patients.value;
}

async function onSearchContracts(q: string): Promise<Document[] | null> {
  query.value.contract = q;
  await onFetchContracts();
  return contracts.value;
}

const onCreateAffiliation = async () => {
  isLoadingCreatingAffiliation.value = true;
  try {
    const affiliation: Subscription = await $api('/affiliation', {
      method: 'POST',
      body: {
        patientId: payload.value.patientId,
        subscriptionId: payload.value.subscriptionId,
        status: payload.value.status,
        contract: payload.value.contract,
        logs: payload.value.logs
      }
    });
    await router.push(`/pre/affiliation/${affiliation._id}`);
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
              label="¿Quién es el títular del contrato?"
              name="patientId"
              required
          >
            <template #help>
              Si necesitas crear un nuevo titular, puedes hacerlo dando click
              <ULink to="/patients/create?redirect=/pre/affiliation/create" class="underline">aquí</ULink>
            </template>
            <USelectMenu
                show-create-option-when="always"
                :searchable="onSearchPatients"
                searchable-placeholder="Buscar un titular"
                placeholder="Seleccionar un titular"
                :options="patients || []"
                value-attribute="_id"
                v-model="payload.patientId"
            >
              <template #option="{option: patient}">
                <p>
                  <span>{{ patient.name }} {{ patient.lastname }}</span> con documento
                  <span>{{ patient.typeDocument }}</span>.<span>{{ patient.document }}</span>
                </p>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup
              label="¿Qué tipo de contrato?"
              name="subscription"
              required>
            <USelectMenu
                v-model="payload.subscriptionId"
                required
                placeholder="Seleccione un tipo de afiliacion"
                option-attribute="name"
                value-attribute="_id"
                :options="subscriptions"
            >
              <template #option="{option: subscription}">
                <p>
                  <span>{{ subscription.name }} </span> de <span>{{
                    new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP'
                    }).format(subscription.price)
                  }}</span>
                </p>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup
              label="¿Cúal es el contrato?"
              name="contract"
              required>
            <template #help>
              Si necesitas asignar un o varios contratos a un asesor, puedes hacerlo dando click
              <ULink to="/pre/documents?redirect=/pre/affiliation/create" class="underline">aquí</ULink>
            </template>
            <USelectMenu
                searchable-placeholder="Buscar contratos asignados"
                :searchable="onSearchContracts"
                :options="contracts as Document[]"
                v-model="payload.contract"
                option-attribute="full_serial"
                value-attribute="_id"
                required
                placeholder="Seleccione un contrato"
            >
              <template #option="{option: contract}">
                <p>
                  <span>{{ contract.prefix }}</span> <span>{{ contract.serial }}</span> cargado a
                  <span>{{ contract.givenBy.name }} {{ contract.givenBy.lastname }}</span>
                </p>
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup
              label="¿Que estado tiene la afiliación?"
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
