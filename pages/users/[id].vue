<script setup lang="ts">
import {z} from "zod";
import {UserType} from "~/types/user";
import type {Ref} from "vue";

definePageMeta({
  auth: true,
  layout: 'pre',
})

useHead({
  title: 'Usuarios',
})

const route = useRoute();
const {$api} = useNuxtApp();
const auth = useAuth();
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
const updateUserSchema = z.object({
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
  }).optional(),
  confirm_password: z.string().min(8, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).max(32, {
    message: 'La contraseña debe tener entre 8 y 32 caracteres'
  }).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional(),
  kind: z.nativeEnum(UserType, {
    message: 'El tipo de usuario no es válido'
  }),
});

const {data: user, error: errorUser} = await useApi<{
  name: string;
  lastname: string;
  email: string;
  kind: UserType;
}>(`/users/${route.params.id}`, {
  method: 'GET',
});
const password: Ref<string> = ref('');
const confirmPassword: Ref<string> = ref('');

const isLoadingUpdatingUser = ref(false);

if (!user.value || errorUser.value) {
  throw createError({
    statusCode: 404,
    message: 'Usuario no encontrado',
  });
}

const updateUserState = computed(() => ({
  name: user.value?.name,
  lastname: user.value?.lastname,
  email: user.value?.email,
  kind: user.value?.kind,
}));

const onSubmit = async () => {
  if (!confirm('¿Estás seguro de actualizar este usuario?')) {
    return;
  }
  try {
    isLoadingUpdatingUser.value = true;
    await $api(`/users/${route.params.id}`, {
      method: 'PUT',
      body: {
        name: user.value?.name,
        lastname: user.value?.lastname,
        email: user.value?.email,
        kind: user.value?.kind,
        tenantId: auth.user.value.tenantId,
      },
    });
    isLoadingUpdatingUser.value = false;
    await router.push('/users');
    toast.add({
      color: 'green',
      title: '¡Listo!',
      description: 'El usuario ha sido actualizado correctamente',
    });
  } catch (e: unknown | any) {
    isLoadingUpdatingUser.value = false;
    toast.add({
      color: 'red',
      title: '¡Ups!',
      description: e.data.message || 'Ha ocurrido un error al actualizar el usuario',
    });
  }

}
</script>

<template>
  <section class="space-y-4">
    <AppNavHeader title="Editar usuario"  back="/users" confirm/>
    <UForm
        v-if="user"
        @submit="onSubmit"
        :state="updateUserState"
        :schema="updateUserSchema"
        class="max-w-screen-sm space-y-4 mx-auto"
    >
      <UCard>
        <article class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
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
          <UFormGroup
              label="Correo electrónico"
              name="email"
              required>
            <UInput
                required
                v-model="user.email"
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
                v-model="user.kind"
                :options="userKindOptions"
                option-attribute="label"
                value-attribute="value"
            />
          </UFormGroup>
          <UFormGroup
              help="La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial eg. @, $, !, %, *, ?, &, #"
              label="Contraseña"
              name="password">
            <UInput
                v-model="password"
                type="password"
                placeholder="********"
            />
          </UFormGroup>
          <UFormGroup
              help="La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial eg. @, $, !, %, *, ?, &, #"
              label="Confirma la contraseña"
              name="confirm_password">
            <UInput
                v-model="confirmPassword"
                type="password"
                placeholder="********"
            />
          </UFormGroup>
        </article>
      </UCard>
      <UButton
          :disabled="isLoadingUpdatingUser"
          :loading="isLoadingUpdatingUser"
          type="submit" class="col-span-full" block>
        Actualizar usuario
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
