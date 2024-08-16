<script setup lang="ts">
import {z} from "zod";
import {UserType} from "~/types/user";

definePageMeta({
  auth: true,
  layout: 'pre',
  role: ['ADMIN'],
})

useHead({
  title: 'Editar profesional'
})

const router = useRouter();
const route = useRoute();
const {$api} = useNuxtApp();
const toast = useToast();

const {data: doctor, error: errorDoctor} = await useApi<{
  _id: string;
  name: string;
  lastname: string;
  email: string;
  kind: string;
  granted: boolean;
  password: string | undefined,
  confirmPassword: string | undefined,
}>(`/doctors/${route.params.id}`, {
  method: 'GET',
  transform: (doctor) => ({
    ...doctor,
    confirmPassword: doctor.password ? '' : undefined,
    password: doctor.password ? '' : undefined
  })
});

if (!doctor.value && errorDoctor.value) {
  throw createError({
    statusCode: 404,
    message: 'Especialista no encontrado'
  });
}

const editDoctorSchema = z.object({
  name: z.string({
    message: 'El nombre no es válido'
  }),
  lastname: z.string({
    message: 'El apellido no es válido'
  }),
  email: z.string({
    message: 'El correo electrónico no es válido'
  }).email({
    message: 'El correo electrónico no es válido'
  }).optional().nullish(),
  password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional(),
  confirm_password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional().refine((data) => data === doctor.value?.password, {
    message: 'Las contraseñas no coinciden',
  }),
  kind: z.nativeEnum(UserType),
  granted: z.boolean(),
});

const editDoctorState = computed(() => ({
  name: doctor.value?.name,
  lastname: doctor.value?.lastname,
  email: doctor.value?.email || undefined,
  password: doctor.value?.password || undefined,
  confirm_password: doctor.value?.confirmPassword || undefined,
  kind: UserType.DOCTOR,
  granted: doctor.value?.granted,
}));

const onSubmit = async () => {
  try {
    await $api(`/doctors/${route.params.id}`, {
      method: 'PUT',
      body: {
        confirmPassword: doctor.value?.confirmPassword || undefined,
        password: doctor.value?.password || undefined,
        email: doctor.value?.email || undefined,
        ...doctor.value
      }
    });
    await router.push('/doctors');
    toast.add({
      title: '¡Listo!',
      description: 'El especialista ha sido editado exitosamente',
      color: 'green'
    })
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error al editar el especialista',
      color: 'red'
    })
  }
}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Editar especialista" back="/doctors" confirm/>
    <UForm
        @submit="onSubmit"
        :state="editDoctorState"
        :schema="editDoctorSchema"
        class="max-w-screen-sm space-y-4 mx-auto"
    >
      <UCard>
        <article class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          <UFormGroup label="Nombres" name="name" required>
            <UInput
                required
                type="text"
                v-model="doctor.name"
                placeholder="eg. John"
            />
          </UFormGroup>
          <UFormGroup label="Apellidos" name="lastname" required>
            <UInput
                type="text"
                required
                v-model="doctor.lastname"
                placeholder="eg. Doe"
            />
          </UFormGroup>
          <UFormGroup class="col-span-full">
            <UCheckbox
                v-model="doctor.granted"
                label="¿Puede iniciar sesíon?"
            />
          </UFormGroup>
          <div
              class="col-span-full space-y-4"
              v-if="doctor.granted">
            <UFormGroup
                class="col-span-full"
                label="Correo electrónico"
                name="email"
                required>
              <UInput
                  required
                  v-model="doctor.email"
                  type="email"
                  placeholder="eg. john@doe.com"
              />
            </UFormGroup>
            <UFormGroup
                help="La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial eg. @, $, !, %, *, ?, &, #"
                label="Contraseña"
                name="password"
                required>
              <UInput
                  required
                  v-model="doctor.password"
                  type="password"
                  placeholder="********"
              />
            </UFormGroup>
            <UFormGroup
                help="La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial eg. @, $, !, %, *, ?, &, #"
                label="Confirma la contraseña"
                name="confirm_password"
                required>
              <UInput
                  required
                  v-model="doctor.confirmPassword"
                  type="password"
                  placeholder="********"
              />
            </UFormGroup>
          </div>
        </article>
      </UCard>
      <UButton type="submit" block>
        Editar especialista
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
