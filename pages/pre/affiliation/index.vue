<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";
import dayjs from "dayjs";

definePageMeta({
  auth: true,
  layout: 'pre'
})

useHead({
  title: 'Suscriptor'
})

const columns = [
  {
    label: 'Titular',
    key: 'patient',
    sortable: true
  },
  {
    label: 'Tipo',
    key: 'kind',
    sortable: true
  },
  {
    label: 'Beneficiarios',
    key: 'beneficiaries',
    sortable: true
  },
  {
    label: 'Contrato',
    key: 'contract',
    sortable: true
  },
  {
    label: 'Estado',
    key: 'status',
    sortable: true
  },
  {
    label: 'Expira en',
    key: 'expiresAt',
    sortable: true
  },
  {
    label: 'Creado en',
    key: 'createdAt',
    sortable: true
  },
  {
    label: 'Actualizado en',
    key: 'updatedAt',
    sortable: true
  },
  {
    label: 'Acciones',
    key: 'actions',
    sortable: false
  }
];


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

const toast = useToast();
const {$api} = useNuxtApp();

const isCreatingAffiliation: Ref<boolean> = ref(false);
const isLoadingCreatingAffiliation: Ref<boolean> = ref(false);

const patient: Ref<string> = ref('');

const queryPatient: Ref<string> = ref('');
const queryContract: Ref<string> = ref('');

const page: Ref<number> = ref(1);
const pageSize: Ref<number> = ref(10);
const sortBy: Ref<string> = ref('createdAt');
const sort: Ref<string> = ref('desc');

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

const {data: affiliations, refresh: FetchAffiliations} = await useApi<any[]>('/affiliation', {
  params: {
    page: page,
    pageSize: pageSize,
    sortBy: sortBy,
    sort: sort,
    filters: {
      patientId: {
        $regex: patient,
        $options: 'i'
      }
    }
  },
  watch: [page, pageSize, sortBy, sort],
  transform: (data) => {
    return data.map((affiliation: any) => ({
      patient: affiliation.patientId,
      kind: affiliation.subscription.name,
      contract: affiliation.contract,
      beneficiaries: affiliation.beneficiaries.length || 0,
      status: affiliationStatus.find((status) => status.value === affiliation.status)?.label,
      expiresAt: dayjs(affiliation.expiresAt).format('MMM D, YYYY h:mm A'),
      createdAt: dayjs(affiliation.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(affiliation.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
});

const {data: count} = await useApi<number>('/affiliation/count', {
  params: {
    filters: {
      patientId: {
        $regex: patient,
        $options: 'i'
      }
    }
  },
  watch: [patient],
  transform: (data) => {
    return Number(data);
  }
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
      kind: 'CONTRACT'
    }
  },
  transform: (data) => {
    return data.map((contract) => ({
      _id: contract._id,
      serial: contract.serial,
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


const creatingAffiliationState = computed(() => ({
  patient: payload.value.patientId,
  subscription: payload.value.subscriptionId,
  status: payload.value.status,
  contract: payload.value.contract
}));

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
    isLoadingCreatingAffiliation.value = false;
    await FetchAffiliations();
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
    isCreatingAffiliation.value = false;
  } catch (e: unknown | any) {
    isLoadingCreatingAffiliation.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error inesperado al crear los documentos',
      color: 'red'
    });
  }
}

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
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-center text-2xl">
      Suscriptor
    </h2>
    <nav class="flex justify-between items-end">
      <UFormGroup
          label="Numero del documento"
          required
      >
        <UInput
            required
            v-model="patient"
            placeholder="eg. 43542190"
        />
      </UFormGroup>
      <UButton
          @click="isCreatingAffiliation = !isCreatingAffiliation"
          trailing-icon="i-heroicons-plus">
        Crear afiliacion
      </UButton>
    </nav>
    <UTable
        :columns="columns"
        :rows="affiliations || []"
        class="bg-white dark:bg-gray-900 rounded-xl shadow"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <p class="text-gray-500 dark:text-gray-400">No hay afiliaciones</p>
        </div>
      </template>
    </UTable>
    <!--    -->
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
    <!--    -->
    <Teleport to="body">
      <UModal v-model="isCreatingAffiliation">
        <article>
          <UForm
              :schema="creatingAffiliationSchema"
              :state="creatingAffiliationState"
              class="p-4 space-y-4"
              @submit="onCreateAffiliation">

            <UFormGroup
                label="Titular"
                name="patient"
                required>
              <USelectMenu
                  searchable-placeholder="Buscar titular"
                  :searchable="onSearchPatients"
                  v-model="payload.patientId"
                  required
                  placeholder="Seleccione un titular"
                  :options="patients || []"
                  by="_id"
                  option-attribute="name"
                  value-attribute="document"
              />
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
                  searchable-placeholder="Buscar contrato"
                  :searchable="onSearchContracts"
                  :options="contracts || []"
                  v-model="payload.contract"
                  option-attribute="serial"
                  value-attribute="serial"
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


            <UButton
                :loading="isLoadingCreatingAffiliation"
                :disabled="isLoadingCreatingAffiliation"
                type="submit" block>
              Crear afiliación
            </UButton>
          </UForm>
        </article>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
