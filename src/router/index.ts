import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 라우트 정의
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '홈', showTabs: true },
  },
  {
    path: '/map',
    name: 'learning-map',
    component: () => import('../views/LearningMapView.vue'),
    meta: { title: '학습맵', showTabs: true },
  },
  {
    path: '/my-learning',
    name: 'my-learning',
    component: () => import('../views/MyLearningView.vue'),
    meta: { title: '내 학습', showTabs: true },
  },
  {
    path: '/content/:id',
    name: 'content',
    component: () => import('../views/ContentView.vue'),
    meta: { title: '콘텐츠', showTabs: false },
    props: true,
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('../views/CreatorView.vue'),
    meta: { title: '창조 모드', showTabs: false },
  },
  {
    // 404 페이지
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '페이지를 찾을 수 없음', showTabs: false },
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

// 정적 모드 확인
const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'

// 페이지 타이틀 업데이트 및 정적 모드 리다이렉트
router.beforeEach((to, _from, next) => {
  // 정적 모드에서 /create 경로 접근 시 홈으로 리다이렉트
  if (isStaticMode && to.path === '/create') {
    next({ path: '/' })
    return
  }

  const title = to.meta.title as string | undefined
  document.title = title ? `${title} - EduFlix` : 'EduFlix'
  next()
})

export default router
