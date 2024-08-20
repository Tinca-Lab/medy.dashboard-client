<script setup lang="ts">
import type {Ref} from "vue";
import {z} from "zod";

definePageMeta({
  auth: true,
  layout: 'pre',
  role: ['ADMIN'],
})

useHead({
  title: 'Editar servicio'
})

const editServiceSchema = z.object({
  name: z.string({
    message: 'El nombre no es válido'
  }),
  price: z.number({
    message: 'El precio no es válido'
  }),
  discount: z.number({
    message: 'El descuento no es válido'
  }).optional().nullish(),
});

const router = useRouter();
const toast = useToast();
const route = useRoute();
const {$api} = useNuxtApp();

const queryDoctor: Ref<string> = ref('');

const isLoadingEditingService: Ref<boolean> = ref(false);

const {data: service, error: errorService} = await useApi<{
  name: string;
  price: number;
  discount?: number;
  doctors: {
    _id: string;
    name: string;
    lastname: string;
  }[];
}>(`/services/${route.params.id}`, {
  method: 'GET'
});

if (!service.value && errorService.value) {
  throw createError({
    statusCode: 404,
    message: 'Servicio no encontrado'
  });
}

const {data: doctors, refresh: onFetchDoctors} = await useApi<any[]>('/doctors', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sort: 'desc',
    filters: {
      name: {
        $regex: queryDoctor,
        $options: 'i'
      }
    }
  },
  watch: [queryDoctor],
  transform: (data) => {
    return data.map((doctor) => ({
      _id: doctor._id,
      name: doctor.name,
      lastname: doctor.lastname,
    }))
  },
})

// computed
const serviceState = computed(() => ({
  name: service.value?.name,
  price: service.value?.price,
  discount: service.value?.discount || undefined,
}))

const onSubmit = async () => {
  if (!confirm('¿Estás seguro de editar este servicio?')) return;
  isLoadingEditingService.value = true;
  try {
    await $api(`/services/${route.params.id}`, {
      method: 'PUT',
      body: {
        name: service.value?.name,
        price: service.value?.price,
        discount: service.value?.discount,
        doctors: service.value?.doctors?.map((doctor: any) => doctor._id),
      }
    });
    toast.add({
      title: '¡Listo!',
      description: 'Servicio editado correctamente',
      color: 'green'
    });
    if (route.query.redirect) {
      const redirect = (route.query.redirect as string).split(',');
      const query = redirect.slice(1).join(',');

      await router.push({
        path: redirect[0],
        query: {
          redirect: query ? query : undefined,
        },
      });
      return;
    }
    await router.push('/services');
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al editar el servicio',
      color: 'red'
    })
  } finally {
    isLoadingEditingService.value = false;
  }
}

const onSearchDoctors = async (search: string) => {
  queryDoctor.value = search;
  await onFetchDoctors();
  return doctors.value;
}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader
        title="Editar servicio"
        back="/services"
        confirm
    />
    <UForm
        @submit="onSubmit"
        :state="serviceState"
        :schema="editServiceSchema"
        class="max-w-screen-sm mx-auto space-y-4">
      <UCard>
        <article class="space-y-4">
          <UFormGroup
              class="col-span-full"
              label="Nombres" name="name" required>
            <UInput
                required
                type="text"
                v-model="service.name"
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
                v-model="service.price"
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
                v-model="service.discount"
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
                :options="service.doctors || []"
                v-model="service.doctors"
                by="_id"
            >
              <template #label>
                {{ service?.doctors?.length || 0 }} especialista(s) seleccionado(s)
              </template>
              <template #option-create>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/${route.params.id}`"
                >
                  Crear especialista
                </UButton>
              </template>
              <template #empty>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/${route.params.id}`"
                >
                  Crear especialista
                </UButton>
              </template>
              <template #option-empty>
                <UButton
                    size="sm"
                    variant="outline"
                    :to="`/doctors/create?redirect=/services/${route.params.id}`"
                >
                  Crear especialista
                </UButton>
              </template>
              <template #option="{ option: doctor }">
                <span> {{ doctor.name }} {{ doctor.lastname }}</span>
              </template>
            </USelectMenu>
          </UFormGroup>
        </article>
      </UCard>
      <UButton type="submit" class="col-span-full" block>
        Editar servicio
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
