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
  kind: z.nativeEnum(UserType),
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
  kind: UserType.USER,
});

// methods
const onSubmit = async () => {
  try {
    await $api('/patients', {
      method: 'POST',
      body: {
        confirmPassword: createUser.value.confirm_password,
        ...createUser.value,
        tenantId: user.value.tenantId,
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
  email: createUser.value.email,
  password: createUser.value.password,
  confirm_password: createUser.value.confirm_password,
  kind: createUser.value.kind,
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
          <UFormGroup
              class="col-span-full"
              label="Correo electrónico"
              name="email"
              required>
            <UInput
                required
                v-model="createUser.email"
                type="email"
                placeholder="eg. john@doe.coms"
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
      <UButton type="submit" block>
        Crear paciente
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
