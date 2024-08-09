<script setup lang="ts">
// composable
const {user, logout} = useAuth();

// non reactive data
const items = [
  [
    {
      label: 'Configuración',
      icon: 'i-heroicons-cog-8-tooth'
    }
  ],
  [
    {
      label: 'Cerrar sesión',
      slot: 'signout',
      icon: 'i-heroicons-arrow-left-on-rectangle'
    }
  ]
]
</script>

<template>
  <nav
      class="w-full max-w-screen-xl h-auto fixed top-4 left-1/2 -translate-x-1/2 z-10 bg-white"
  >
    <UContainer class="flex items-center justify-between h-20 bg-white shadow rounded-xl">
      <ul class="flex items-center gap-4 text-lg">
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/users">
            Usuarios
          </ULink>
        </li>
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/patients">
            Pacientes
          </ULink>
        </li>
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/doctors">
            Doctores
          </ULink>
        </li>
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/services">
            Catálogo
          </ULink>
        </li>
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/appointments">
            Citas
          </ULink>
        </li>
        <li>
          <ULink
              active-class="text-primary border-b-2 border-primary"
              to="/schedule">
            Programacion
          </ULink>
        </li>
      </ul>
      <UDropdown
          :items="items"
          :ui="{ item: { disabled: 'cursor-text select-text' } }"
          :popper="{ placement: 'bottom-end' }">
        <UContainer class="flex items-center gap-2">
          <UAvatar :alt="user.name"/>
          <p>{{ user.name }} {{ user.lastname }}</p>
          <UIcon
              name="i-heroicons-chevron-down"
              dynamic
          />
        </UContainer>

        <template #item="{ item }">
          <span class="truncate">{{ item.label }}</span>

          <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto"/>
        </template>

        <template #signout>
          <span @click="logout()" class="truncate">Sign out</span>
          <UIcon
              name="i-heroicons-arrow-left-on-rectangle"
              class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 ms-auto"
          />
        </template>
      </UDropdown>
    </UContainer>
  </nav>
</template>

<style scoped>

</style>
