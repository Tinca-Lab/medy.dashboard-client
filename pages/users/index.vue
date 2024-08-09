<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import {z} from "zod";

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
const {user} = useAuth();
const toast = useToast();

// non reactive data
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
];
const columns = [
  {
    label: 'Nombre',
    key: 'name',
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
    label: 'Acciones',
    key: 'actions',
  },
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
  kind: z.nativeEnum(UserType),
});

// data
const createUser = ref<{
  name: string;
  lastname: string;
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
const isCreating = ref(false);
const isLoadingCreatingUser = ref(false);

const queryUser: Ref<string> = ref('');

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

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
  default: () => [],
})

const {data: count, pending: isLoadingCount, refresh: FetchCount} = await useApi<number>('/users/count', {
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
  default: () => 0,
  transform: (data) => Number(data),
});

const selected: Ref<any[]> = ref([]);

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
    await FetchUsers();
    await FetchCount();
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
}))</script>

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
          @click="isCreating=!isCreating"
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
    </UTable>
    <UPagination
        v-model="page"
        :page-count="pageSize"
        :total="count || 0"
    />
    <!--    -->
    <Teleport to="body">
      <UModal v-model="isCreating">
        <UContainer>
          <UForm
              @submit="onSubmit"
              :state="createUserState"
              :schema="createUserSchema"
              class="grid grid-cols-2 gap-4">
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
            <UButton
                :disabled="isLoadingCreatingUser"
                :loading="isLoadingCreatingUser"
                type="submit" class="col-span-full" block>
              Crear usuario
            </UButton>
          </UForm>
        </UContainer>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
