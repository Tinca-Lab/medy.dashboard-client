<script setup lang="ts">
import {UserType} from "~/types/user";
import {z} from "zod";

definePageMeta({
  auth: true,
  layout: 'pre',
  role: ['ADMIN'],
})

useHead({
  title: 'Crear especialista',
})

// composable
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
  }).optional().nullish(),
  password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional().nullish(),
  confirm_password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,32}$/, {
    message: 'La contraseña debe contener al menos una letra minúscula, una letra mayúscula, un número y un carácter especial'
  }).optional().nullish(),
  kind: z.nativeEnum(UserType),
});


const createUser = ref<{
  name: string | undefined;
  lastname: string | undefined;
  email: string | undefined;
  password: string | undefined;
  confirm_password: string | undefined;
  kind: UserType;
  granted: boolean;
}>({
  name: undefined,
  lastname: undefined,
  email: undefined,
  password: undefined,
  confirm_password: undefined,
  kind: UserType.DOCTOR,
  granted: true,
});
const isCreating = ref(false);


// methods
const onSubmit = async () => {
  try {
    await $api('/doctors', {
      method: 'POST',
      body: {
        name: createUser.value.name,
        lastname: createUser.value.lastname,
        email: createUser.value.email,
        granted: createUser.value.granted,
        password: createUser.value.password,
        confirmPassword: createUser.value.confirm_password,
        kind: createUser.value.kind,
        tenantId: user.value.tenantId,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El profesional ha sido creado exitosamente',
      color: 'green'
    })
    isCreating.value = false;
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
    await router.push('/doctors');
  } catch (e: unknown | any) {
    console.log(e);
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al crear el usuario',
      color: 'red'
    })
  }
};

// computed
const createUserState = computed(() => ({
  name: createUser.value.name,
  lastname: createUser.value.lastname,
  email: createUser.value.email || null,
  password: createUser.value.password || null,
  confirm_password: createUser.value.confirm_password || null,
  granted: createUser.value.granted,
  kind: createUser.value.kind,
}))
</script>

<template>
  <section class="space-y-2">
    <AppNavHeader title="Crear especialista" back="/doctors" confirm/>
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
          <UFormGroup class="col-span-full">
            <UCheckbox
                v-model="createUser.granted"
                label="¿Puede iniciar sesíon?"
            />
          </UFormGroup>
          <div
              class="col-span-full space-y-4"
              v-if="createUser.granted">
            <UFormGroup
                class="col-span-full"
                label="Correo electrónico"
                name="email"
                required>
              <UInput
                  required
                  v-model="createUser.email"
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
      <UButton type="submit" class="col-span-full" block>
        Crear doctor
      </UButton>
    </UForm>
  </section>
</template>

<style scoped>

</style>
