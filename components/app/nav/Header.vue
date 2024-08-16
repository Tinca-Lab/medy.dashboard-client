<script setup lang="ts">
const props = defineProps<{
  back: string;
  title: string;
  confirm?: boolean;
}>();

const router = useRouter();

const onBack = () => {
  if (props.confirm) {
    if (confirm('¿Estás seguro de que deseas salir?')) {
      router.push(props.back);
    }
  } else {
    router.push(props.back);
  }
}
</script>

<template>
  <UContainer class="bg-white rounded-2xl shadow mb-4 flex items-center justify-between">
    <UButton
        leading-icon="i-heroicons-arrow-left"
        size="lg"
        @click="onBack"
    >
      Volver
    </UButton>
    <p class="text-lg font-bold">
      {{ title }}
    </p>
  </UContainer>
</template>

<style scoped>

</style>
