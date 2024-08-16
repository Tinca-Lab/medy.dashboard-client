<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import dayjs from "dayjs";

useHead({
  title: 'Usuarios',
})

definePageMeta({
  auth: true,
  role: ['ADMIN'],
  layout: 'pre',
})

// composable
const {$api} = useNuxtApp();
const toast = useToast();

// non reactive data
const columns = [
  {
    label: 'Nombre',
    key: 'full_name',
  },
  {
    label: 'Correo electrónico',
    key: 'email',
  },
  {
    label: 'Rol',
    key: 'kind',
  },
  {
    label: 'Creado en',
    key: 'createdAt',
  },
  {
    label: 'Actualizado en',
    key: 'updatedAt',
  },
  {
    label: 'Acciones',
    key: 'actions',
  },
];

const queryUser: Ref<string> = ref('');

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

const isLoadingDeletingUser = ref(false);

const {data: users, pending: isLoadingUsers, refresh: FetchUsers} = await useApi<any[]>('/users', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort, queryUser],
  params: {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sort: sort.value,
    filters: {
      kind: {
        $in: [UserType.MANAGER, UserType.ADMIN, UserType.ASSISTANT]
      },
      $or: [
        {
          name: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          email: {
            $regex: queryUser,
            $options: 'i',
          }
        }
      ]
    }
  },
  transform: (data) => {
    return data.map((user) => {
      return {
        _id: user._id,
        email: user.email,
        createdAt: dayjs(user.createdAt).format('MMM D, YYYY  h:mm A'),
        updatedAt: dayjs(user.updatedAt).format('MMM D, YYYY  h:mm A'),
        full_name: `${user.name} ${user.lastname}`,
        kind: user.kind === UserType.ADMIN ? 'Administrador' : user.kind === UserType.MANAGER ? 'Auxiliar' : user.kind === UserType.ASSISTANT ? 'Asesor' : 'Atención al cliente',
      }
    })
  }
})

const {data: count, refresh: FetchCount} = await useApi<number>('/users/count', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [queryUser],
  params: {
    filters: {
      kind: {
        $in: [UserType.MANAGER, UserType.ADMIN, UserType.ASSISTANT]
      },
      $or: [
        {
          name: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryUser,
            $options: 'i',
          }
        },
        {
          email: {
            $regex: queryUser,
            $options: 'i',
          }
        },
      ]
    }
  },
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

// methods
const onDeleteUser = async (id: string) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
  try {
    isLoadingDeletingUser.value = true;
    await $api(`/users/${id}`, {
      method: 'DELETE',
    })
    toast.add({
      title: '¡Listo!',
      description: 'El usuario ha sido eliminado exitosamente',
      color: 'green'
    })
    isLoadingDeletingUser.value = false;
    await FetchUsers();
    await FetchCount();
  } catch (e: unknown | any) {
    isLoadingDeletingUser.value = false;
    toast.add({
      title: '¡Ups!',
      description: e.data.message || 'Ocurrió un error desconocido al eliminar el usuario',
      color: 'red'
    })
  }
};
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          required
          label="Buscar usuario"
      >
        <UInput
            v-model="queryUser"
            placeholder="Buscar usuario por nombre, apellido, correo electrónico"
        />
      </UFormGroup>
      <UButton
          to="/users/create"
          trailing-icon="i-heroicons-plus">
        Crear usuario
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingUsers"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="users || []"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay usuarios</p>
        </div>
      </template>
      <template #loading-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-arrow-path"
              class="animate-spin h-8 w-8 text-primary"/>
        </div>
      </template>
      <template #actions-data="{ row }">
        <article class="flex items-center gap-x-2 p-0 m-0">
          <UButton
              :to="`/users/${row._id}`"
              type="button"
              variant="ghost"
              title="Editar usuario"
              size="xs"
              icon="i-heroicons-pencil"
          >
          </UButton>
          <UButton
              :loading="isLoadingDeletingUser"
              :disabled="isLoadingDeletingUser"
              type="button"
              @click="onDeleteUser(row._id)"
              color="red"
              title="Eliminar usuario"
              size="xs"
              icon="i-heroicons-trash"
          />
        </article>
      </template>
    </UTable>
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
  </div>
</template>

<style scoped>

</style>
