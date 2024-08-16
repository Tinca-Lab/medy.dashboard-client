<script setup lang="ts">
import {z} from "zod";
import type {Ref} from "vue";

definePageMeta({
  auth: true,
  layout: 'pre',
  role: ['ADMIN'],
})

useHead({
  title: 'Crear servicio',
})

const router = useRouter();
const toast = useToast();
const {$api} = useNuxtApp();

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
const selectedDoctors = ref<any[]>([]);
const isCreating: Ref<boolean> = ref(false);
const queryDoctor: Ref<string> = ref('');

const {data: doctors, refresh: onFetchDoctors} = await useApi<any[]>('/doctors', {
  method: 'GET',
  server: false,
  lazy: true,
  query: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
  },
  params: {
    filters: {
      name: {
        $regex: queryDoctor,
        $options: 'i'
      }
    }
  },
  transform: (data) => {
    return data.map((doctor) => ({
      _id: doctor._id,
      full_name: `${doctor.name} ${doctor.lastname}`,
      name: doctor.name,
      lastname: doctor.lastname,
    }))
  },
})


// computed
const createServiceState = computed(() => ({
  name: createService.value.name,
  price: createService.value.price,
  discount: createService.value.discount,
}))

// methods
const onSearchDoctors = async (search: string) => {
  queryDoctor.value = search;
  await onFetchDoctors();
  return doctors.value;
}

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
    isCreating.value = false;
    await router.push('/services');
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al crear el servicio',
      color: 'red'
    })
  }
}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Crear servicio" back="/services" confirm/>

    <UForm
        @submit="onSubmit"
        :state="createServiceState"
        :schema="createServiceSchema"
        class="max-w-screen-sm space-y-4 mx-auto"
    >
      <UCard>
        <article
            class="grid grid-cols-2 gap-4"
        >
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
                show-create-option-when="always"
                creatable
                :multiple="true"
                :searchable="onSearchDoctors as any"
                searchable-placeholder="Buscar un especialista"
                placeholder="Selecciona los especialistas"
                :options="doctors || []"
                option-attribute="full_name"
                value-attribute="_id"
                v-model="selectedDoctors"
            >
              <template #option-create>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/create`"
                >
                  Crear especialista
                </UButton>
              </template>
              <template #empty>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/create`"
                >
                  Crear especialista
                </UButton>
              </template>
              <template #option-empty>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/create`"
                >
                  Crear especialista
                </UButton>
              </template>
            </USelectMenu>
          </UFormGroup>
        </article>
      </UCard>

      <UButton type="submit" class="col-span-full" block>
        Crear servicio
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
