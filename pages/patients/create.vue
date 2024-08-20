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
const {user} = useAuth();
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

const createUserSchema = z.object({
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
  granted: z.boolean(),
});

// data
const createUser = ref<{
  name: string | undefined;
  lastname: string | undefined;
  document: string | undefined;
  typeDocument: string | undefined;
  email: string | undefined;
  phone: string | undefined;
  password: string | undefined;
  confirm_password: string | undefined;
  kind: UserType;
  granted: boolean | 'phone' | 'email';
}>({
  name: undefined,
  lastname: undefined,
  document: undefined,
  typeDocument: undefined,
  email: undefined,
  phone: undefined,
  password: undefined,
  confirm_password: undefined,
  kind: UserType.USER,
  granted: true,
});

// methods
const onSubmit = async () => {
  try {
    await $api('/patients', {
      method: 'POST',
      body: {
        password: createUser.value.password,
        confirmPassword: createUser.value.confirm_password,
        name: createUser.value.name,
        lastname: createUser.value.lastname,
        email: createUser.value.email,
        phone: createUser.value.phone,
        kind: createUser.value.kind,
        granted: createUser.value.granted,
        tenantId: user.value.tenantId,
        document: createUser.value.document,
        typeDocument: createUser.value.typeDocument,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El paciente ha sido creado exitosamente',
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
      description: e.data.message || 'Ocurrió un error desconocido al crear el usuario',
      color: 'red'
    })
  }
}

// computed
const createUserState = computed(() => ({
  name: createUser.value.name,
  lastname: createUser.value.lastname,
  document: createUser.value.document,
  typeDocument: createUser.value.typeDocument,
  email: createUser.value.email,
  phone: createUser.value.phone,
  password: createUser.value.password,
  confirm_password: createUser.value.confirm_password,
  kind: createUser.value.kind,
  granted: createUser.value.granted,
}))
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Crear paciente" back="/patients" confirm/>
    <UForm
        @submit="onSubmit"
        :state="createUserState"
        :schema="createUserSchema"
        class="max-w-screen-sm mx-auto space-y-4">
      <UCard>
        <article class="grid grid-cols-2 gap-4">
          <UFormGroup label="Nombres" name="name" required>
            <UInput
                required
                type="text"
                v-model="createUser.name"
                placeholder="eg. John"
            />
          </UFormGroup>
          <UFormGroup label="Apellidos" name="lastname" required>
            <UInput
                type="text"
                required
                v-model="createUser.lastname"
                placeholder="eg. Doe"
            />
          </UFormGroup>
          <UFormGroup label="Tipo de documento" name="typeDocument" required>
            <USelect
                placeholder="Selecciona un tipo de documento"
                v-model="createUser.typeDocument"
                :options="typeDocumentOptions"
            />
          </UFormGroup>
          <UFormGroup label="Número de documento" name="document" required>
            <UInput
                required
                v-model="createUser.document"
                type="text"
                placeholder="eg. 1234567890"
            />
          </UFormGroup>
          <UFormGroup class="col-span-full">
            <UCheckbox
                :model-value="!!createUser.granted"
                @update:model-value="createUser.granted = $event"
                label="¿Puede iniciar sesíon?"
            />
          </UFormGroup>
          <div
              class="col-span-full space-y-4"
              v-if="createUser.granted">
            <UFormGroup
                label="Correo electrónico"
                name="email"
                :required="createUser.granted && !createUser.phone">
              <UInput
                  :required="createUser.granted && !createUser.phone"
                  v-model="createUser.email"
                  type="email"
                  placeholder="eg. john@doe.com"
              />
            </UFormGroup>
            <UFormGroup
                label="Teléfono celular"
                name="phone"
                :required="createUser.granted && !createUser.email"
            >
              <UInput
                  :required="createUser.granted && !createUser.email"
                  v-model="createUser.phone"
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
                  v-model="createUser.password"
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
                  v-model="createUser.confirm_password"
                  type="password"
                  placeholder="********"
              />
            </UFormGroup>
          </div>
        </article>
      </UCard>
      <UButton type="submit" block>
        Crear paciente
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
