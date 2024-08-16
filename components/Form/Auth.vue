<script setup lang="ts">
import {z} from 'zod';
import type {ComputedRef} from "vue";


const emits = defineEmits<{
  (event: 'onSubmit'): void
}>();

const schema = z.object({
  email: z.string({
    message: "Correo electrónico requerido",
  }).email("Correo electrónico inválido"),
  password: z.string({
    message: "Contraseña requerida",
  }).min(1, "Contraseña inválida"),
});

const email = defineModel('email', {
  required: true,
  default: '',
});

const password = defineModel('password', {
  required: true,
  default: '',
});

const state: ComputedRef<any> = computed(() => ({
  email: email.value,
  password: password.value,
}));

const onSubmit = async () => {
  emits('onSubmit');
};

</script>

<template>
  <section class="h-screen w-full flex justify-center items-center">
    <UForm
        :schema="schema"
        :state="state"
        @submit="onSubmit"
    >
      <UCard class="w-fit max-w-96 font-">
        <template #header>
          <div class="text-center">
            <UIcon
                name="i-heroicons-lock-closed"
                class="w-8 h-8 flex-shrink-0 text-gray-900 dark:text-white"
            />
            <p class="text-2xl text-gray-900 dark:text-white font-bold">¡Bienvenid@!</p>
          </div>
        </template>
        <template #default>
          <article class="flex flex-col gap-4">
            <UFormGroup
                required
                label="Correo electrónico"
                name="email"
                help="Nunca compartiremos tu correo electrónico con nadie más."
            >
              <UInput
                  type="email"
                  placeholder="john@doe.com"
                  icon="i-heroicons-envelope"
                  v-model="email"
                  required
              />
            </UFormGroup>
            <UFormGroup
                required
                name="password"
                label="Contraseña"
            >
              <UInput
                  type="password"
                  placeholder="********"
                  v-model="password"
                  icon="i-heroicons-lock-closed"
                  required
              />
            </UFormGroup>
            <UButton
                type="submit"
                block>
              Iniciar sesión
            </UButton>
          </article>
          <UDivider class="my-4"/>
          <p class="text-gray-500 dark:text-gray-400">
            Al iniciar sesión, aceptas nuestros
            <NuxtLink class="font-medium text-primary">
              Términos de servicio
            </NuxtLink>
            .
          </p>
        </template>
      </UCard>
    </UForm>
  </section>
</template>

<style scoped>

</style>
