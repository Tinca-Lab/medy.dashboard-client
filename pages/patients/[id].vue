<script setup lang="ts">
import {z} from "zod";
import {UserType} from "~/types/user";

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

useHead({
  title: 'Crear paciente',
})

const {$api} = useNuxtApp();
const toast = useToast();
const router = useRouter();
const route = useRoute();

const typeDocumentOptions = [
  {label: 'Cédula de ciudadanía', value: 'CC'},
  {label: 'Cédula de extranjería', value: 'CE'},
  {label: 'Pasaporte', value: 'PA'},
  {label: 'Tarjeta de identidad', value: 'TI'},
  {label: 'Registro civil', value: 'RC'},
  {label: 'NIT', value: 'NIT'},
];

const editUserSchema = z.object({
  name: z.string({
    message: 'El nombre no es válido'
  }),
  lastname: z.string({
    message: 'El apellido no es válido'
  }),
  document: z.string({
    message: 'El documento no es válido'
  }).regex(/^(?=.*\d)[\dA-Za-z\-]{5,20}$/, {
    message: 'El numero de documento no es un número de documento colombiano válido'
  }),
  typeDocument: z.string({
    message: 'El tipo de documento no es válido'
  }),
  email: z.string({
    message: 'El correo electrónico no es válido'
  }).email({
    message: 'El correo electrónico no es válido'
  }).optional().nullish(),
  phone: z.string({
    message: 'El correo electrónico no es válido'
  }).regex(/^(\+57)?3\d{9}$/, {
    message: 'El número de teléfono no es un numero de teléfono colombiano válido'
  }).optional().nullish(),
  password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional().nullish(),
  confirm_password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional().nullish(),
  kind: z.nativeEnum(UserType),
  granted: z.boolean().optional().nullish(),
});

// data
const {data: user, error: errorUser} = await useApi<{
  name: string;
  lastname: string;
  document: string;
  typeDocument: string;
  email: string;
  phone: string;
  kind: UserType;
  password: string;
  confirm_password: string;
  granted?: boolean;
}>(`/patients/${route.params.id}`, {
  method: 'GET',
  transform: (data) => {
    return {
      name: data.name,
      lastname: data.lastname,
      document: data.document,
      typeDocument: data.typeDocument,
      email: data.email,
      phone: data.phone,
      kind: data.kind,
      granted: data.granted,
      password: undefined,
      confirm_password: undefined,
    }
  },
})

if (!user.value && errorUser.value) {
  throw createError({
    statusCode: 404,
    message: 'No se encontró el paciente',
  })
}

// methods
const onSubmit = async () => {
  if (!confirm('¿Estás seguro de actualizar este paciente?')) {
    return;
  }
  try {
    await $api(`/patients/${route.params.id}`, {
      method: 'PUT',
      body: {
        confirmPassword: user.value?.confirm_password,
        ...user.value,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El paciente ha sido actualizado exitosamente',
      color: 'green'
    })
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
    await router.push('/patients');
  } catch (e: unknown | any) {
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al actualizar el usuario',
      color: 'red'
    })
  }
}

// computed
const editUserState = computed(() => ({
  name: user.value?.name,
  lastname: user.value?.lastname,
  document: user.value?.document,
  typeDocument: user.value?.typeDocument,
  email: user.value?.email,
  phone: user.value?.phone,
  password: user.value?.password,
  confirm_password: user.value?.confirm_password,
  kind: user.value?.kind,
  granted: user.value?.granted,
}))
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Actualizar paciente" back="/patients" confirm/>
    <UForm
        v-if="user"
        @submit="onSubmit"
        :state="editUserState"
        :schema="editUserSchema"
        class="max-w-screen-sm mx-auto space-y-4">
      <UCard>
        <article class="grid grid-cols-2 gap-4">
          <UFormGroup label="Nombres" name="name" required>
            <UInput
                required
                type="text"
                v-model="user.name"
                placeholder="eg. John"
            />
          </UFormGroup>
          <UFormGroup label="Apellidos" name="lastname" required>
            <UInput
                type="text"
                required
                v-model="user.lastname"
                placeholder="eg. Doe"
            />
          </UFormGroup>
          <UFormGroup label="Tipo de documento" name="typeDocument" required>
            <USelect
                placeholder="Selecciona un tipo de documento"
                v-model="user.typeDocument"
                :options="typeDocumentOptions"
            />
          </UFormGroup>
          <UFormGroup label="Número de documento" name="document" required>
            <UInput
                required
                v-model="user.document"
                type="text"
                placeholder="eg. 1234567890"
            />
          </UFormGroup>
          <UFormGroup class="col-span-full">
            <UCheckbox
                :model-value="!!user.granted"
                @update:model-value="user.granted = $event"
                label="¿Puede iniciar sesíon?"
            />
          </UFormGroup>
          <div
              class="col-span-full space-y-4"
              v-if="user.granted">
            <UFormGroup
                label="Correo electrónico"
                name="email"
                :required="user.granted && !user.phone">
              <UInput
                  :required="user.granted && !user.phone"
                  v-model="user.email"
                  type="email"
                  placeholder="eg. john@doe.com"
              />
            </UFormGroup>
            <UFormGroup
                label="Teléfono celular"
                name="phone"
                :required="user.granted && !user.email"
            >
              <UInput
                  :required="user.granted && !user.email"
                  v-model="user.phone"
                  type="text"
                  placeholder="eg. 3001234567"
              />
            </UFormGroup>
            <UFormGroup
                help="La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial eg. @, $, !, %, *, ?, &, #"
                label="Contraseña"
                name="password"
                required>
              <UInput
                  required
                  v-model="user.password"
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
                  v-model="user.confirm_password"
                  type="password"
                  placeholder="********"
              />
            </UFormGroup>
          </div>
        </article>
      </UCard>
      <UButton type="submit" block>
        Editar paciente
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
