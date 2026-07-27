import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { watch } from 'vue'
import { canGenerate } from '../services/api/capabilities'
import { t, useI18n, type MessageKey } from '../i18n'

// 라우트 정의 - 타이틀은 번역 키로 두고 언어 전환 시 다시 계산한다
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { titleKey: 'routes.home', showTabs: true },
  },
  {
    path: '/map',
    name: 'learning-map',
    component: () => import('../views/LearningMapView.vue'),
    meta: { titleKey: 'routes.learningMap', showTabs: true },
  },
  {
    path: '/my-learning',
    name: 'my-learning',
    component: () => import('../views/MyLearningView.vue'),
    meta: { titleKey: 'routes.myLearning', showTabs: true },
  },
  {
    path: '/content/:id',
    name: 'content',
    component: () => import('../views/ContentView.vue'),
    meta: { titleKey: 'routes.content', showTabs: false },
    props: true,
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('../views/CreatorView.vue'),
    meta: { titleKey: 'routes.create', showTabs: false },
  },
  {
    // 404 페이지
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { titleKey: 'routes.notFound', showTabs: false },
  },
]

function applyDocumentTitle(titleKey?: MessageKey) {
  const title = titleKey ? t(titleKey) : ''
  document.title = title ? `${title} - EduFlix` : 'EduFlix'
}

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

  applyDocumentTitle(to.meta.titleKey as MessageKey | undefined)
  next()
})

// 언어를 바꾸면 현재 페이지 타이틀도 즉시 갱신한다
const { locale } = useI18n()
watch(locale, () => {
  applyDocumentTitle(router.currentRoute.value.meta.titleKey as MessageKey | undefined)
})

export default router
