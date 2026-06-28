import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/public/HomeView.vue'
import AboutView from '../views/public/AboutView.vue'
import RulesView from '../views/public/RulesView.vue'
import DashboardView from '../views/student/DashboardView.vue'
import SuccessView from '../views/student/SuccessView.vue'
import AdminPanel from '../views/admin/AdminPanel.vue'
import NotFoundView from '../views/public/NotFoundView.vue'
import WarningView from '../views/public/WarningView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/warning',
      name: 'warning',
      component: WarningView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/rules',
      name: 'rules',
      component: RulesView
    },

    {
      path: '/vote',
      name: 'vote',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'student' }
    },
    {
      path: '/success',
      name: 'success',
      component: SuccessView
    },

    {
      path: '/admin',
      name: 'admin',
      component: AdminPanel,
      meta: { requiresAuth: true, role: 'admin' }
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView
    }
  ]
})

import Swal from 'sweetalert2';
import authStore from '@/stores/auth';

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;

  if (!authStore.isAuthenticated) {
    authStore.initialize();
  }

  const userRole = authStore.user?.role;

  if (requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next('/');
    }

    if (to.meta.role && to.meta.role !== userRole) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have permission to view this page.',
        confirmButtonColor: '#d33',
        timer: 3000
      });
      return next('/');
    }
  }

  next();
});

export default router
