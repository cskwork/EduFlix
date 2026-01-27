<script setup lang="ts">
export type IconName =
  // Tab icons
  | 'contents'
  | 'learning-map'
  | 'my-learning'
  // Subject icons
  | 'math'
  | 'science'
  | 'english'
  | 'book'
  // Status icons
  | 'completed'
  | 'in-progress'
  | 'available'
  | 'locked'
  // Other icons
  | 'flame'
  | 'star'
  | 'arrow-right'

interface Props {
  name: IconName
  size?: number | string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor',
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="icon"
  >
    <!-- Contents (Play/Video) -->
    <template v-if="name === 'contents'">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2" />
      <polygon points="10,8 16,12 10,16" fill="currentColor" />
    </template>

    <!-- Learning Map -->
    <template v-else-if="name === 'learning-map'">
      <path
        d="M3 6L9 3L15 6L21 3V18L15 21L9 18L3 21V6Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <line x1="9" y1="3" x2="9" y2="18" stroke="currentColor" stroke-width="2" />
      <line x1="15" y1="6" x2="15" y2="21" stroke="currentColor" stroke-width="2" />
    </template>

    <!-- My Learning (Chart) -->
    <template v-else-if="name === 'my-learning'">
      <rect x="3" y="12" width="4" height="8" rx="1" fill="currentColor" />
      <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" />
      <rect x="17" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </template>

    <!-- Math (Ruler/Triangle) -->
    <template v-else-if="name === 'math'">
      <path
        d="M4 20L4 4L20 20H4Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <line x1="4" y1="8" x2="7" y2="8" stroke="currentColor" stroke-width="1.5" />
      <line x1="4" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.5" />
      <line x1="4" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="1.5" />
    </template>

    <!-- Science (Flask) -->
    <template v-else-if="name === 'science'">
      <path
        d="M9 2V8L4 18C3.5 19 4.2 20 5.5 20H18.5C19.8 20 20.5 19 20 18L15 8V2"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <line x1="8" y1="2" x2="16" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="12" cy="15" rx="4" ry="2" fill="currentColor" opacity="0.3" />
    </template>

    <!-- English (Book Open) -->
    <template v-else-if="name === 'english'">
      <path
        d="M2 4C2 4 5 3 12 3C19 3 22 4 22 4V20C22 20 19 19 12 19C5 19 2 20 2 20V4Z"
        stroke="currentColor"
        stroke-width="2"
      />
      <line x1="12" y1="3" x2="12" y2="19" stroke="currentColor" stroke-width="2" />
    </template>

    <!-- Book (Contents count) -->
    <template v-else-if="name === 'book'">
      <path
        d="M4 4H8C10 4 12 5 12 7V20C12 18 10 17 8 17H4V4Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <path
        d="M20 4H16C14 4 12 5 12 7V20C12 18 14 17 16 17H20V4Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
    </template>

    <!-- Completed (Check Circle) -->
    <template v-else-if="name === 'completed'">
      <circle cx="12" cy="12" r="10" fill="#4ade80" />
      <path
        d="M8 12L11 15L16 9"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>

    <!-- In Progress (Half Circle) -->
    <template v-else-if="name === 'in-progress'">
      <circle cx="12" cy="12" r="10" stroke="#facc15" stroke-width="2" fill="none" />
      <path
        d="M12 2A10 10 0 0 1 12 22"
        fill="#facc15"
      />
    </template>

    <!-- Available (Empty Circle) -->
    <template v-else-if="name === 'available'">
      <circle cx="12" cy="12" r="10" stroke="#60a5fa" stroke-width="2" fill="none" />
      <circle cx="12" cy="12" r="3" fill="#60a5fa" />
    </template>

    <!-- Locked -->
    <template v-else-if="name === 'locked'">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#6b7280" stroke-width="2" />
      <path
        d="M8 11V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V11"
        stroke="#6b7280"
        stroke-width="2"
        stroke-linecap="round"
      />
    </template>

    <!-- Flame (Streak) -->
    <template v-else-if="name === 'flame'">
      <path
        d="M12 2C12 2 8 6 8 10C8 12.5 9 14 10 15C9 13 10 11 12 10C14 11 15 13 14 15C15 14 16 12.5 16 10C16 6 12 2 12 2Z"
        fill="url(#flame-gradient)"
      />
      <path
        d="M12 22C9 22 7 19.5 7 17C7 14.5 9 13 12 11C15 13 17 14.5 17 17C17 19.5 15 22 12 22Z"
        fill="url(#flame-gradient)"
      />
      <defs>
        <linearGradient id="flame-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stop-color="#fbbf24" />
          <stop offset="1" stop-color="#ef4444" />
        </linearGradient>
      </defs>
    </template>

    <!-- Star -->
    <template v-else-if="name === 'star'">
      <path
        d="M12 2L14.4 9.2H22L16 13.8L18.4 21L12 16.4L5.6 21L8 13.8L2 9.2H9.6L12 2Z"
        :fill="color"
      />
    </template>

    <!-- Arrow Right -->
    <template v-else-if="name === 'arrow-right'">
      <path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
