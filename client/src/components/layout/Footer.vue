<script setup>
import {
  PhInstagramLogo,
  PhTelegramLogo,
  PhYoutubeLogo,
  PhTiktokLogo,
  PhHeart
} from '@phosphor-icons/vue';
</script>

<template>
  <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto transition-colors duration-300">
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

      <div class="flex items-center gap-2">
        <span class="font-bold text-xl text-slate-dark dark:text-white tracking-tight">
          DiSK<span class="text-clubGreen"> Voting System v2.0</span>
        </span>
      </div>

      <div class="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        <span>Made with</span>
        <PhHeart size="16" weight="fill" class="text-red-500 animate-pulse" />
        <span>by</span>
        <span class="font-bold text-slate-700 dark:text-slate-200">Student</span>
        <span>for</span>
        <span class="font-bold text-slate-700 dark:text-slate-200">Students</span>
      </div>

      <div class="flex gap-4">
        <a href="https://www.instagram.com/disktapah/" class="text-slate-400 hover:text-pink-600 transition-colors" title="Instagram">
          <PhInstagramLogo size="24" weight="fill" />
        </a>

        <a href="https://t.me/WeDoNotJustCode" class="text-slate-400 hover:text-blue-500 transition-colors" title="Telegram">
          <PhTelegramLogo size="24" weight="fill" />
        </a>

        <a href="https://www.youtube.com/@disktapahchannel9974" class="text-slate-400 hover:text-red-500 transition-colors" title="Youtube">
          <PhYoutubeLogo size="24" weight="fill" />
        </a>

        <a href="https://www.tiktok.com/@disktapah?_t=8pp2jlnxuin" class="text-slate-400 hover:text-black dark:hover:text-white transition-colors" title="TikTok">
          <PhTiktokLogo size="24" weight="fill" />
        </a>
      </div>

    </div>
  </footer>
</template>
