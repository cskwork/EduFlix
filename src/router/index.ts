import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { canGenerate } from '../services/api/capabilities'

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

// 페이지 타이틀 업데이트 및 생성 불가 배포에서의 리다이렉트
router.beforeEach((to, _from, next) => {
  // 생성 경로가 아예 없는 배포에서만 홈으로 리다이렉트한다
  // (Vercel 서버리스 생성이 켜져 있으면 /create를 그대로 연다)
  if (!canGenerate && to.path === '/create') {
    next({ path: '/' })
    return
  }

  const title = to.meta.title as string | undefined
  document.title = title ? `${title} - EduFlix` : 'EduFlix'
  next()
})

export default router
