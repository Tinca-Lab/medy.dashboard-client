<template>
  <UCard>
    <template #header>
      <UFormGroup label="Mes del año">
        <UInput
            class="w-max"
            type="month"
            v-model="selectedMonth"
        />
      </UFormGroup>
    </template>
    <section class="grid grid-cols-7 rounded bg-primary-100 mb-2">
      <div
          v-for="day in days"
          :key="day"
          class="text-center p-2 font-bold">
        {{ day }}
      </div>
    </section>
    <div class="space-y-2">
      <div
          v-for="week in weeks"
          :key="week.id"
          class="grid grid-cols-7 gap-2">
        <UCard

            @click="onShowEvents(day.date)"
            v-for="day in week.days"
            :key="day.id"
            class="h-24 text-right hover:bg-primary-50 cursor-pointer rounded"
        >
          <p class="font-bold">
            {{ day.date }}
          </p>
          <div v-if="hasAppointments(day.date)" class="flex justify-center flex-wrap">
            <article
                v-if="appointmentsForDay(day.date).length > 5">
              <UChip
                  v-for="n in 5"
                  :key="n"
                  class="m-1.5"/>
              <p class="text-xs">
                + {{ appointmentsForDay(day.date).length - 5 }} citas
              </p>
            </article>
            <template v-else>
              <UChip
                  v-for="n in appointmentsForDay(day.date).length"
                  :key="n"
                  class="m-1"/>
            </template>
          </div>
        </UCard>
      </div>
    </div>
    <Teleport to="body">
      <UModal v-model="isShowEvents">
        <article>
          <ul>
            <li v-for="appointment in selectedAppointments">
              {{ appointment }}
            </li>
          </ul>
        </article>
      </UModal>
    </Teleport>
  </UCard>
</template>

<script setup lang="ts">
import {computed, type Ref, ref, watch} from 'vue';
import dayjs from 'dayjs';

definePageMeta({
  auth: true,
  layout: 'pre',
})

useHead({
  title: 'Calendario de citas',
})

// non-reactive data
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// data
const selectedMonth: Ref<string> = ref(new Date().toISOString().slice(0, 7));
const start: Ref<string> = ref(dayjs(selectedMonth.value).startOf('month').format('YYYY-MM-DD'));
const end: Ref<string> = ref(dayjs(selectedMonth.value).endOf('month').format('YYYY-MM-DD'));

const isShowEvents = ref(false);
const selected = ref('');
const selectedAppointments = ref([]);


const {data: schedule} = await useApi<any>(() => `/schedule?start=${start.value}&end=${end.value}`, {
  watch: [start, end],
  server: false,
  immediate: true,
});

const weeks = computed(() => onGenerateWeeks(selectedMonth.value));

const onGenerateWeeks = (monthYear: string) => {
  const [year, month] = monthYear.split('-').map(Number);
  const date = new Date(year, month - 1, 1); // Start of the selected month

  const weeksArray = [];
  const startDay = date.getDay(); // Day of the week the month starts on
  const totalDays = new Date(year, month, 0).getDate(); // Total days in the month

  let dayCounter = 1 - startDay; // Start counting days to align with the correct weekday
  for (let week = 0; week < 6; week++) {
    const daysArray = [];
    for (let day = 0; day < 7; day++) {
      if (dayCounter > 0 && dayCounter <= totalDays) {
        daysArray.push({id: `${week}-${day}`, date: dayCounter});
      } else {
        daysArray.push({id: `${week}-${day}`, date: ''});
      }
      dayCounter++;
    }
    weeksArray.push({id: `week-${week}`, days: daysArray});
  }
  return weeksArray;
};

const hasAppointments = (day: number | string) => {
  const date = dayjs(`${selectedMonth.value}-${day}`).format('YYYY-MM-DD');
  return schedule.value?.some((schedule: { date: string }) => schedule.date === date);
};

const appointmentsForDay = (day: number | string) => {
  const date = dayjs(`${selectedMonth.value}-${day}`).format('YYYY-MM-DD');
  return schedule.value?.find((schedule: { date: string }) => schedule.date === date)?.appointments || [];
};


function onShowEvents(day: string | number) {
  selected.value = dayjs(`${selectedMonth.value}-${day}`).format('YYYY-MM-DD');
  selectedAppointments.value = appointmentsForDay(day);
  isShowEvents.value = true;
}

watch(selectedMonth, () => {
  start.value = dayjs(selectedMonth.value).startOf('month').format('YYYY-MM-DD');
  end.value = dayjs(selectedMonth.value).endOf('month').format('YYYY-MM-DD');
}, {immediate: true});
</script>
