import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 라우트 정의
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '홈' },
  },
  {
    path: '/content/:id',
    name: 'content',
    component: () => import('../views/ContentView.vue'),
    meta: { title: '콘텐츠' },
    props: true,
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('../views/CreatorView.vue'),
    meta: { title: '창조 모드' },
  },
  {
    // 404 페이지
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음' },
  },
]

// 라우터 인스턴스 생성
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    // 뒤로가기 시 스크롤 위치 복원
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
})

// 페이지 타이틀 업데이트
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} - EduFlix` : 'EduFlix'
  next()
})

export default router
