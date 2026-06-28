<script setup>
</script>

<template>
  <div class=" flex-1 w-full py-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-slate-200 dark:border-slate-700 overflow-hidden">

      <div class="bg-slate-900 px-8 py-6">
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <i class="ph-bold ph-gavel"></i>
          Terms & Regulations
        </h1>
      </div>

      <div class="p-8 space-y-8 ">

        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <i class="ph-fill ph-warning-octagon text-red-500"></i>
            1. Usage & Conduct
          </h2>
          <ul class="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              <strong>One-Student-One-Vote:</strong> Double voting is strictly prohibited. The system automatically rejects any attempt to vote more than once.
            </li>
            <li>
              <strong>Integrity:</strong> Any attempt to hack, manipulate results, or use another student's ID will result in immediate disciplinary action.
            </li>
            <li>
              <strong>Finality:</strong> Once a vote is cast and confirmed, it cannot be changed or revoked.
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <i class="ph-fill ph-shield-check text-clubGreen"></i>
            2. Data Privacy
          </h2>
          <p class="text-slate-600 dark:text-slate-300 leading-relaxed">
            Your Student ID is used solely for authentication purposes to ensure eligibility.
            The system is designed such that your specific vote choice is <strong>not publicly linked</strong>
            to your identity in the public results, ensuring the secrecy of your vote.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <i class="ph-fill ph-question text-presGold"></i>
            3. Technical Support
          </h2>
          <p class="text-slate-600 dark:text-slate-300">
            If your Student ID is shown as "Invalid" or if the system crashes during your session, please contact with a member of the <a class="text-emerald-500 hover:text-emerald-600 font-bold cursor-pointer" target="_blank" href="https://wa.me/601125337423?text=*Problem%20With%20DiSK%20voting%20Process*%0AMy%20Student%2FVoter%20ID%20is%3A%20%0AMy%20issue%20is%3A%20">Election Committee.</a>
            Do not attempt to refresh the page during transaction processing.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <i class="ph-fill ph-smiley-wink text-cyan-500"></i>
            4. Friendly Reminder
          </h2>
          <p class="text-slate-600 dark:text-slate-300">
            This is a system for simplify voting process, not for fun. Please vote responsibly and do not misuse the system.
            This system also have a security features to ensure the integrity of the election and the data protection.
            So please do not try to hack or misuse the system.
            If you are caught misusing the system, you will be taken disciplinary action.
          </p>
        </div>
      </div>

      <div class=" px-8 py-4 border-t border-slate-100 dark:border-slate-700 text-center">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Thank you for your cooperation.<br>
          By logging in, you agree to these terms.
        </p>
      </div>

    </div>
  </div>
</template>
