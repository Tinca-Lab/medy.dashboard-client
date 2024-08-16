<script setup lang="ts">

import {UserType} from "~/types/user";
import {z} from "zod";

definePageMeta({
  auth: true,
  layout: 'pre',
})

useHead({
  title: 'Usuarios',
})

const {$api} = useNuxtApp();
const {user} = useAuth();
const toast = useToast();
const router = useRouter();

const userKindOptions = [
  {
    label: 'Asesor',
    value: UserType.ASSISTANT,
  },
  {
    label: 'Auxiliar',
    value: UserType.MANAGER,
  },
  {
    label: 'Administrador',
    value: UserType.ADMIN,
  },
  {
    label: 'Atencion al cliente',
    value: UserType.CUSTOMER_SERVICE,
  }
];
const createUserSchema = z.object({
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
  }),
  password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }),
  confirm_password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }),
  kind: z.nativeEnum(UserType, {
    message: 'El tipo de usuario no es válido'
  }),
});

// data
const createUser = ref<{
  name: string | undefined;
  lastname: string | undefined;
  email: string;
  password: string;
  confirm_password: string;
  kind: UserType;
}>({
  name: undefined,
  lastname: undefined,
  email: '',
  password: '',
  confirm_password: '',
  kind: '',
});
const isCreating = ref(false);
const isLoadingCreatingUser = ref(false);

// methods
const onSubmit = async () => {
  try {
    isLoadingCreatingUser.value = true;
    await $api('/users', {
      method: 'POST',
      body: {
        confirmPassword: createUser.value.confirm_password,
        ...createUser.value,
        tenantId: user.value.tenantId,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El usuario ha sido creado exitosamente',
      color: 'green'
    })
    isCreating.value = false;
    isLoadingCreatingUser.value = false;
    await router.push('/users');
  } catch (e: unknown | any) {
    isLoadingCreatingUser.value = false;
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
  email: createUser.value.email,
  password: createUser.value.password,
  confirm_password: createUser.value.confirm_password,
  kind: createUser.value.kind,
}))
</script>

<template>
  <section class="space-y-2">
    <AppNavHeader title="Crear usuario" back="/users" confirm/>
    <UForm
        @submit="onSubmit"
        :state="createUserState"
        :schema="createUserSchema"
        class="max-w-screen-sm space-y-4 mx-auto"
    >
      <UCard>
        <article class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
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
          <UFormGroup
              label="Correo electrónico"
              name="email"
              required>
            <UInput
                required
                v-model="createUser.email"
                type="email"
                placeholder="eg. Doe"
            />
          </UFormGroup>
          <UFormGroup
              label="Tipo de usuario"
              name="kind"
              required>
            <USelectMenu
                placeholder="Selecciona un tipo de usuarios"
                required
                v-model="createUser.kind"
                :options="userKindOptions"
                option-attribute="label"
                value-attribute="value"
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
        </article>
      </UCard>
      <UButton
          :disabled="isLoadingCreatingUser"
          :loading="isLoadingCreatingUser"
          type="submit" class="col-span-full" block>
        Crear usuario
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
