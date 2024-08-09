<script setup lang="ts">
import type {NuxtError} from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

useHead({
  title: `${props.error?.statusCode} - ${props.error?.message}`
})

const handleError = () => clearError({
  redirect: '/login'
})
</script>

<template>
  <div>
    <h2>{{ error?.statusCode }}</h2>
    <p>{{ error?.message }}</p>
    <button @click="handleError">Go back</button>
  </div>
</template>
