<script setup lang="ts">
import type {Ref} from "vue";


const {user, logout} = useAuth();


// non reactive data
const menu = [
  [
    {
      label: 'Inicio',
      icon: 'i-heroicons-home',
      to: '/'
    },
  ],
  [
    {
      label: 'Pacientes',
      icon: 'i-heroicons-user-group',
      to: '/patients'
    },
    {
      label: 'Profesionales',
      icon: 'i-heroicons-heart',
      to: '/doctors'
    },
    {
      label: 'Catalogo',
      icon: 'i-heroicons-rectangle-stack',
      to: '/services'
    },
    {
      label: 'Citas',
      icon: 'i-heroicons-calendar',
      to: '/appointments'
    },
    {
      label: 'Programación',
      icon: 'i-heroicons-calendar-days',
      to: '/schedule'
    },
    {
      label: 'Usuarios',
      icon: 'i-heroicons-building-office',
      to: '/users'
    },
  ],
  [
    {
      label: 'Papelería',
      icon: 'i-heroicons-document',
      to: '/pre/documents'
    },
    {
      label: 'Afiliaciones',
      icon: 'i-heroicons-user',
      to: '/pre/affiliation'
    }
  ],
  [
    {
      label: 'Configuración',
      icon: 'i-heroicons-cog-8-tooth',
      to: '/settings'
    },
    {
      label: 'Cerrar sesión',
      icon: 'i-heroicons-arrow-left-on-rectangle',
      click: logout
    }
  ]
];

// data
const isSidebar: Ref<boolean> = ref(false);

</script>

<template>
  <div class="_pre p-4">
    <nav class="flex justify-end">
      <UButton
          class="md:hidden block"
          @click="isSidebar = !isSidebar"
          variant="ghost"
          icon="i-heroicons-bars-4"
      />
    </nav>
    <ClientOnly>
      <USlideover
          side="left"
          v-model="isSidebar"
          class="md:hidden"
      >
        <UButton
            class="w-max self-end m-4"
            @click="isSidebar = !isSidebar"
            icon="i-heroicons-x-mark"
        />
        <UVerticalNavigation
            :links="menu"
        />
      </USlideover>
    </ClientOnly>
    <div>
      <aside
          class="hidden md:block bg-white dark:bg-gray-900 min-h-screen w-72 lg:w-80 xl:w-80 fixed top-0 left-0 shadow"
      >
        <UContainer>
          <h1 class="font-semibold text-3xl text-center">
            Medy
            <span class="text-sm font-normal">
            ©
          </span>
          </h1>
          <UVerticalNavigation
              :links="menu"
          />
        </UContainer>

      </aside>
      <main
          class="md:ml-72 lg:ml-80 xl:ml-80"
      >
        <slot/>
      </main>
    </div>
  </div>
</template>

<style scoped>

</style>
