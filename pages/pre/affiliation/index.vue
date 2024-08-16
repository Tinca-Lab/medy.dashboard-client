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

const toast = useToast();
const {$api} = useNuxtApp();
const router = useRouter();

const isLoadingDeletingAffiliation: Ref<boolean> = ref(false);

const patient: Ref<string> = ref('');


const page: Ref<number> = ref(1);
const pageSize: Ref<number> = ref(10);
const sortBy: Ref<string> = ref('createdAt');
const sort: Ref<string> = ref('desc');



const {data: affiliations, refresh: FetchAffiliations} = await useApi<any[]>('/affiliation', {
  params: {
    page: page,
    pageSize: pageSize,
    sortBy: sortBy,
    sort: sort,
    filters: {
      $or: [
        {
          'patient.name': {
            $regex: patient,
            $options: 'i'
          }
        },
        {
          'patient.lastname': {
            $regex: patient,
            $options: 'i'
          }
        },
        {
          'patient.document': {
            $regex: patient,
            $options: 'i'
          }
        }
      ]
    }
  },
  watch: [page, pageSize, sortBy, sort],
  transform: (data) => {
    return data.map((affiliation: any) => ({
      _id: affiliation._id,
      patient: `${affiliation.patient.name} ${affiliation.patient.lastname}`,
      kind: affiliation.subscription.name,
      contract: `${affiliation.contract.prefix}${affiliation.contract.serial}`,
      beneficiaries: affiliation.beneficiaries.length || 0,
      status: affiliationStatus.find((status) => status.value === affiliation.status)?.label,
      expiresAt: dayjs(affiliation.expiresAt).format('MMM D, YYYY h:mm A'),
      createdAt: dayjs(affiliation.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(affiliation.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
});

const {data: count, refresh: FetchCount} = await useApi<number>('/affiliation/count', {
  method: 'GET',
  params: {
    filters: {
      $or: [
        {
          'patient.name': {
            $regex: patient,
            $options: 'i'
          }
        },
        {
          'patient.lastname': {
            $regex: patient,
            $options: 'i'
          }
        },
        {
          'patient.document': {
            $regex: patient,
            $options: 'i'
          }
        }
      ]
    }
  },
  default: () => ref(null),
  server: false,
  lazy: true,
  watch: [patient],
  transform: (data) => Number(data)
});

const onDeleteAffiliation = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar esta afiliación?')) return;
  isLoadingDeletingAffiliation.value = true;
  try {
    await $api(`/affiliation/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: '¡Listo!',
      description: 'La afiliación ha sido eliminada exitosamente',
      color: 'green'
    })
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al eliminar la afiliación',
      color: 'red'
    })
  } finally {
    await FetchAffiliations();
    await FetchCount();
    isLoadingDeletingAffiliation.value = false;
  }
};
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
          @click="router.push('/pre/affiliation/create')"
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
      <template #actions-data="{row}">
        <article class="space-x-2">
          <UButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              :to="`/pre/affiliation/${row._id}`"
          />
          <UButton
              color="red"
              size="sm"
              icon="i-heroicons-trash"
              @click="onDeleteAffiliation(row._id)"
          />
        </article>
      </template>
    </UTable>
    <!--    -->
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
  </div>
</template>

<style scoped>

</style>
