<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";
import dayjs from "dayjs";

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre'
})

useHead({
  title: 'Editar afiliación',
})

const router = useRouter();
const route = useRoute();
const toast = useToast();
const {$api} = useNuxtApp();

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
const editingAffiliationSchema = z.object({
  patient: z.object({
    _id: z.string({
      message: 'Titular inválido'
    }),
    name: z.string({
      message: 'Nombre inválido'
    }),
    lastname: z.string({
      message: 'Apellido inválido'
    }),
  }),
  contract: z.object({
    _id: z.string({
      message: 'Contrato inválido'
    }),
    serial: z.string({
      message: 'Contrato inválido'
    }),
    prefix: z.string({
      message: 'Contrato inválido'
    }),
  }),
  subscription: z.object({
    _id: z.string({
      message: 'Tipo de afiliación inválido'
    }),
    name: z.string({
      message: 'Tipo de afiliación inválido'
    }),
  }),
  status: z.string({
    message: 'Estado inválido'
  }),
  expiresAt: z.string({
    message: 'Fecha de expiración inválida'
  }),
});

const isReceipts: Ref<boolean> = ref(false);
const isAddingReceipt: Ref<boolean> = ref(false);
const receipt = ref({
  _id: '',
  value: 0,
  description: undefined,
});

const isLoadingEditingAffiliation: Ref<boolean> = ref(false);

const queryPatient: Ref<string> = ref('');
const queryContract: Ref<string> = ref('');
const queryReceipt: Ref<string> = ref('');

const isBeneficiaries = ref(false);

const {data: affiliation, error: errorAffiliation, refresh: FetchAffiliation} = await useApi<{
  patient: {
    _id: string;
    name: string;
    lastname: string;
    document: string;
  };
  status: string;
  contract: {
    _id: string;
    serial: string;
    prefix: string;
  };
  subscription: {
    _id: string;
    name: string;
  };
  logs: {
    key: string;
    value: string;
  }[];
  beneficiaries: {
    name: string;
    lastname: string;
    document: string;
  }[];
  expiresAt: string;
  receipts?: any[];
}>(`/affiliation/${route.params.id}`, {
  method: 'GET',
  server: true,
  transform: (affiliation) => ({
    patient: {
      _id: affiliation.patient._id,
      name: affiliation.patient.name,
      lastname: affiliation.patient.lastname,
      full_name: `${affiliation.patient.name} ${affiliation.patient.lastname}`,
      document: affiliation.patient.document,
    },
    status: affiliation.status,
    contract: {
      _id: affiliation.contract._id,
      serial: affiliation.contract.serial,
      prefix: affiliation.contract.prefix,
      full_serial: `${affiliation.contract.prefix}${affiliation.contract.serial}`,
    },
    subscription: {
      _id: affiliation.subscription._id,
      name: affiliation.subscription.name,
    },
    logs: affiliation.logs || [],
    beneficiaries: affiliation.beneficiaries || [],
    expiresAt: dayjs(affiliation.expiresAt).format('YYYY-MM-DD'),
    receipts: affiliation.receipts || [],
  })
})

if (!affiliation.value && errorAffiliation.value) {
  throw createError({
    statusCode: 404,
    message: 'Afiliación no encontrada',
  })
}


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
      name: patient.name,
      lastname: patient.lastname,
      full_name: `${patient.name} ${patient.lastname}`,
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
      used: false,
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

const {data: receipts, refresh: FetchReceipts} = await useApi<any[]>('/document', {
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
        $regex: queryReceipt,
        $options: 'i'
      },
      used: false,
      kind: 'RECEIPT'
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
    }))
  }
})

// computed
const editingAffiliationState = ref({
  patient: {
    _id: affiliation.value?.patient._id,
    name: affiliation.value?.patient.name,
    lastname: affiliation.value?.patient.lastname,
  },
  status: affiliation.value?.status,
  contract: {
    _id: affiliation.value?.contract._id,
    serial: affiliation.value?.contract.serial,
    prefix: affiliation.value?.contract.prefix,
  },
  subscription: {
    _id: affiliation.value?.subscription._id,
    name: affiliation.value?.subscription.name,
  },
  expiresAt: affiliation.value?.expiresAt,
})

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

const onSearchReceipts = async (q: string) => {
  queryReceipt.value = q;
  await FetchReceipts();
  return receipts.value;
}

const onSubmit = async () => {
  if (!confirm('¿Estás seguro de editar esta afiliación?')) {
    return;
  }
  try {
    isLoadingEditingAffiliation.value = true;
    await $api(`/affiliation/${route.params.id}`, {
      method: 'PUT',
      body: {
        patient: {
          _id: affiliation.value?.patient._id,
          name: affiliation.value?.patient.name,
          lastname: affiliation.value?.patient.lastname,
        },
        status: affiliation.value?.status,
        contract: {
          _id: affiliation.value?.contract._id,
          serial: affiliation.value?.contract.serial,
          prefix: affiliation.value?.contract.prefix,
        },
        subscription: {
          _id: affiliation.value?.subscription._id,
          name: affiliation.value?.subscription.name,
        },
        logs: affiliation.value?.logs,
        beneficiaries: affiliation.value?.beneficiaries,
        expiresAt: affiliation.value?.expiresAt ? new Date(affiliation.value.expiresAt).toUTCString() : null,
      }
    });
    toast.add({
      title: '¡Listo!',
      description: 'Afiliación editada correctamente',
      color: 'green',
    })
    await router.push('/pre/affiliation');
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error al editar la afiliación',
      color: 'red',
    })
  } finally {
    isLoadingEditingAffiliation.value = false;
  }
}

const onAddReceipt = async () => {
  if (!confirm('¿Estás seguro de asignar este recibo?')) {
    return;
  }
  const receipts = affiliation.value?.receipts || [];

  if (receipts.find((r) => r._id === receipt.value._id)) {
    toast.add({
      title: '¡Ups!',
      description: 'Este recibo ya ha sido asignado',
      color: 'yellow',
    })
    return;
  }

  if (!receipt.value._id) {
    toast.add({
      title: '¡Ups!',
      description: 'Debes seleccionar un recibo',
      color: 'red',
    })
    return;
  }


  try {
    isLoadingEditingAffiliation.value = true;
    await $api(`/affiliation/${route.params.id}/assign-receipt`, {
      method: 'POST',
      body: {
        affiliationId: route.params.id,
        receiptId: receipt.value._id,
        value: receipt.value.value,
        description: receipt.value.description,
      }
    });
    toast.add({
      title: '¡Listo!',
      description: 'Recibo asignado correctamente',
      color: 'green',
    })
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error al asignar el recibo',
      color: 'red',
    })
  } finally {
    await FetchAffiliation();
    isAddingReceipt.value = false;
    isLoadingEditingAffiliation.value = false;
    receipt.value = {
      _id: '',
      value: 0,
      description: undefined,
    }
  }
}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader
        title="Editar afiliación"
        back="/pre/affiliation"
        confirm
    />
    <UForm
        v-if="affiliation"
        :schema="editingAffiliationSchema"
        :state="editingAffiliationState"
        class="max-w-screen-sm mx-auto space-y-4"
        @submit="onSubmit">

      <section class="flex items-center justify-between">
        <p>
          Contrato:
          <NuxtLink
              :to="`/pre/documents/${affiliation.contract._id}?redirect=/pre/affiliation/${route.params.id}`"
          >
            <b class="underline">
              {{ affiliation.contract.prefix }} {{ affiliation.contract.serial }}
            </b>
          </NuxtLink>
        </p>
        <UButton
            @click="isReceipts = !isReceipts"
            variant="link">
          Ver recibos
        </UButton>
      </section>
      <UCard>
        <article class="space-y-4">
          <UFormGroup
              label="Titular"
              name="patient"
              required>
            <USelectMenu
                searchable-placeholder="Buscar titular o escribe para crear uno nuevo"
                :searchable="onSearchPatients as any"
                v-model="affiliation.patient"
                required
                placeholder="Seleccione un titular"
                :options="patients || []"
                by="_id"
                option-attribute="full_name"
            >
              <template #option-empty>
                <UButton
                    :to="`/patients/create?redirect=/pre/affiliation/${route.params.id}`"
                    variant="outline"
                    size="sm"
                >
                  Crear titular
                </UButton>
              </template>
              <template #option-create>
                <UButton
                    :to="`/patients/create?redirect=/pre/affiliation/${route.params.id}`"
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
                v-model="affiliation.subscription"
                required
                placeholder="Seleccione un tipo de afiliacion"
                option-attribute="name"
                by="_id"
                :options="subscriptions || []"
            />
          </UFormGroup>

          <UFormGroup
              label="Contrato"
              name="contract"
              required>
            <USelectMenu
                searchable-placeholder="Buscar contrato"
                :searchable="onSearchContracts as any"
                :options="contracts || []"
                v-model="affiliation.contract"
                option-attribute="full_serial"
                required
                placeholder="Seleccione un contrato"
            />
          </UFormGroup>

          <UFormGroup
              label="Fecha de expiración"
              name="expiresAt"
          >
            <UInput
                v-model="affiliation.expiresAt"
                type="date"
            />
          </UFormGroup>

          <UFormGroup
              label="Estado"
              name="status"
              required>
            <USelect
                v-model="affiliation.status"
                required
                placeholder="Seleccione un tipo"
                option-attribute="label"
                value-attribute="value"
                :options="affiliationStatus"
            />
          </UFormGroup>
          <article
              v-for="(_, i) in affiliation?.logs"
          >
            <UFormGroup
                v-if="affiliation.logs"
                :label="`Observacion ${i + 1}`"
                :name="'logs.' + i"
            >
              <UTextarea
                  v-model="affiliation.logs[i].value"
                  placeholder="eg. El titular tiene una deuda"
              />
              <UButton
                  class="mt-2"
                  icon="i-heroicons-trash"
                  size="sm"
                  variant="outline"
                  @click="affiliation.logs?.splice(i, 1)"
                  type="button"/>
            </UFormGroup>
          </article>

          <p class="font-semibold text-xl">
            {{ affiliation.beneficiaries.length }}
            <span class="text-lg">
              beneficiario(s)
            </span>
          </p>


          <UButton
              size="sm"
              variant="outline"
              @click="affiliation.logs?.push({ key: 'note', value: '' })"
              type="button"
          >
            Agregar observacion
          </UButton>

          <UButton
              class="mx-2"
              size="sm"
              variant="outline"
              @click="isAddingReceipt = !isAddingReceipt"
              type="button"
          >
            Asignar recibo
          </UButton>

          <UButton
              @click="isBeneficiaries = !isBeneficiaries"
              size="sm"
          >
            Beneficiarios
          </UButton>
        </article>

      </UCard>

      <Teleport to="body">
        <UModal
            v-model="isBeneficiaries"
        >
          <section class="space-y-4 h-fit p-4">
            <p class="text-xl">
              Beneficiarios
            </p>
            <span
                class="text-sm underline"
                v-if="!affiliation.beneficiaries[0]">
              No tiene beneficiarios
            </span>
            <section class="max-h-96 overflow-y-auto space-y-4 rounded-xl">
              <UCard class="bg-gray-100" v-for="(beneficiary, index) in affiliation.beneficiaries">
                <article class="space-y-2">
                  <UFormGroup
                      label="Nombre"
                      name="name"
                      required
                  >
                    <UInput
                        v-model="beneficiary.name"
                        placeholder="Nombre"
                    />
                  </UFormGroup>
                  <UFormGroup
                      label="Apellido"
                      name="lastname"
                      required
                  >
                    <UInput
                        required
                        v-model="beneficiary.lastname"
                        placeholder="Apellido"
                    />
                  </UFormGroup>
                  <UFormGroup
                      label="Documento"
                      name="document"
                      required
                  >
                    <UInput
                        required
                        v-model="beneficiary.document"
                        placeholder="Documento"
                    />
                  </UFormGroup>
                  <UButton
                      color="red"
                      size="sm"
                      variant="outline"
                      @click="affiliation.beneficiaries?.splice(index, 1)"
                      type="button"
                  >
                    Eliminar
                  </UButton>
                </article>
              </UCard>
            </section>
            <section class="flex items-center gap-2">
              <UButton
                  size="sm"
                  variant="outline"
                  @click="affiliation.beneficiaries?.push({ name: '', document: '' , lastname: ''})"
                  type="button">
                Agregar beneficiario
              </UButton>
              <UButton
                  @click="isBeneficiaries = false"
                  size="sm"
                  type="button"
              >
                Guardar beneficiarios
              </UButton>
            </section>
          </section>
        </UModal>
      </Teleport>

      <UButton
          :loading="isLoadingEditingAffiliation"
          :disabled="isLoadingEditingAffiliation"
          type="submit"
          block>
        Actualizar afiliación
      </UButton>
    </UForm>
    <Teleport to="body">
      <USlideover v-model="isReceipts">
        <article class="p-4 space-y-4 overflow-y-auto">
          <p class="text-lg font-semibold">
            Recibos
          </p>
          <UCard
              v-for="receipt in affiliation?.receipts"
          >
            <NuxtLink
                :to="`/pre/documents/${receipt._id}`"
            >
              <p>
                Recibo:
                <b>
                  {{ receipt.prefix }} {{ receipt.serial }}
                </b>
              </p>
              <span>
              {{ dayjs(receipt.createdAt).format('DD MMM, YYYY') }}
            </span>
              <p class="text-green-700">
                $ {{ new Intl.NumberFormat('es-CO').format(receipt.value) }} COP
              </p>
              <p class="text-sm truncate">
                {{ receipt.description }}
              </p>
            </NuxtLink>
          </UCard>
        </article>
      </USlideover>
      <UModal v-model="isAddingReceipt">
        <article v-if="affiliation" class="p-4 space-y-4">
          <p class="text-lg font-bold mb-4">
            Agregar recibo
          </p>
          <UFormGroup
              required
              label="Recibo"
          >
            <USelectMenu
                searchable-placeholder="Buscar recibo"
                :searchable="onSearchReceipts as any"
                placeholder="Seleccionar recibo"
                option-attribute="full_serial"
                v-model="receipt"
                :options="receipts || []">
              <template #empty>
                No hay recibos
              </template>
            </USelectMenu>
          </UFormGroup>
          <UFormGroup
              label="Valor"
              required
          >
            <UInput :disabled="!receipt._id" v-model="receipt.value" placeholder="eg. 100000" type="number" :min="1"/>
          </UFormGroup>
          <UFormGroup
              label="Descripción"
          >
            <UTextarea
                :maxrows="4"
                v-model="receipt.description"
                placeholder="eg. Usuario abono a la deuda"
            />
          </UFormGroup>
          <UButton
              @click="onAddReceipt"
              type="button"
              size="sm"
          >
            Asignar recibo
          </UButton>
        </article>
      </UModal>
    </Teleport>
  </section>
</template>

<style scoped>

</style>
