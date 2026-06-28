<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  candidates: {
    type: Array,
    default: () => []
  }
});

const chartData = computed(() => {
  return {
    labels: props.candidates.map(c => c.name.replace(/([A-Z])/g, ' $1').trim()),
    datasets: [
      {
        label: 'Votes Received',
        axis: 'y',
        backgroundColor: [
          '#10B981',
          '#F59E0B',
          '#3B82F6',
          '#8B5CF6'
        ],
        borderRadius: 4,
        barPercentage: 0.4,
        data: props.candidates.map(c => c.votes)
      }
    ]
  };
});

const chartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#0F172A',
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: '#E2E8F0',
        borderDash: [5, 5],
      },
      ticks: {
        precision: 0,
        font: { family: 'sans-serif', size: 11 },
        color: '#94A3B8'
      },
      border: { display: false }
    },
    y: {
      grid: { display: false },
      ticks: {
        autoSkip: false,
        font: {
          family: 'Poppins, sans-serif',
          size: 13,
          weight: 'bold'
        },
        color: '#94A3B8'
      }
    }
  }
};
</script>

<template>
  <div class="h-[600px] w-full p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
    <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Live Vote Tally</h3>

    <div class="h-[520px]">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
