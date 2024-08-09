<script setup lang="ts">
import {UserType} from "~/types/user";
import type {Ref} from "vue";
import {z} from "zod";
import dayjs from "dayjs";

useHead({
  title: 'Especialistas',
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
    label: 'Fecha de nacimiento',
    key: 'birthdate',
  },
  {
    label: 'Creado en',
    key: 'createdAt',
    sortable: true,
  },
  {
    label: 'Última actualización',
    key: 'updatedAt',
    sortable: true,
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
  kind: UserType.DOCTOR,
});
const isCreating = ref(false);

const queryDoctor: Ref<string> = ref('');

const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('createdAt');
const sort = ref('asc');

const {data: doctors, pending: isLoadingDoctors, refresh: onFetchDoctors} = await useApi<any[]>('/doctors', {
  method: 'GET',
  server: false,
  lazy: true,
  watch: [page, pageSize, sortBy, sort],
  params: {
    page: page.value,
    pageSize: pageSize.value,
    sortBy: sortBy.value,
    sort: sort.value,
    filters: {
      $or: [
        {
          name: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryDoctor,
            $options: 'i',
          }
        }
      ]
    }
  },
  default: () => [],
  transform: (data) => {
    return data.map((doctor) => ({
      _id: doctor._id,
      name: `${doctor.name} ${doctor.lastname}`,
      email: doctor.email,
      birthdate: doctor.birthdate ? dayjs(doctor.birthdate).format('MMM D, YYYY') : 'N/A',
      createdAt: dayjs(doctor.createdAt).format('MMM D, YYYY h:mm A'),
      updatedAt: dayjs(doctor.updatedAt).format('MMM D, YYYY h:mm A'),
    }))
  }
})

const {data: count, refresh: onFetchCount} = await useApi<number>('/doctors/count', {
  method: 'GET',
  server: false,
  lazy: true,
  params: {
    filters: {
      $or: [
        {
          name: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          lastname: {
            $regex: queryDoctor,
            $options: 'i',
          }
        },
        {
          document: {
            $regex: queryDoctor,
            $options: 'i',
          }
        }
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
    await $api('/doctors', {
      method: 'POST',
      body: {
        confirmPassword: createUser.value.confirm_password,
        ...createUser.value,
        tenantId: user.value.tenantId,
      },
    })
    toast.add({
      title: '¡Listo!',
      description: 'El doctor ha sido creado exitosamente',
      color: 'green'
    })
    onFetchDoctors();
    onFetchCount();
    isCreating.value = false;
  } catch (e: unknown | any) {
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
  email: createUser.value.email,
  password: createUser.value.password,
  confirm_password: createUser.value.confirm_password,
  kind: createUser.value.kind,
}))
</script>

<template>
  <div class="space-y-4">
    <nav class="w-full flex items-center justify-between">
      <UFormGroup
          label="Buscar doctor"
          required
      >
        <UInput
            placeholder="Buscar doctor"
            v-model="queryDoctor"
        />
      </UFormGroup>
      <UButton
          @click="isCreating=!isCreating"
          trailing-icon="i-heroicons-plus">
        Crear doctor
      </UButton>
    </nav>
    <UTable
        v-model="selected"
        :loading="isLoadingDoctors"
        class="bg-white rounded-xl shadow"
        :columns="columns"
        :rows="doctors || []"
    >
      <template #empty-state>
        <div class="flex items-center justify-center h-64">
          <UIcon
              name="i-heroicons-information-circle"
              class="h-8 w-8 text-gray-400 dark:text-gray-500"/>
          <p class="text-gray-400 dark:text-gray-500 ml-2">No hay doctores</p>
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
            <UButton type="submit" class="col-span-full" block>
              Crear paciente
            </UButton>
          </UForm>
        </UContainer>
      </UModal>
    </Teleport>
  </div>
</template>

<style scoped>

</style>
