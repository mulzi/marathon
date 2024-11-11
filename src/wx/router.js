import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from './views/HomeView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/home',
    name: 'wxhome',
    component: HomeView
  },
  {
    path: '/products',
    name: 'products',
    component:  () => import(/* webpackChunkName: "about" */ './views/Products.vue')
  },
  {
    path: '/productsview',
    name: 'productsview',
    component:  () => import(/* webpackChunkName: "about" */ './views/ProductsView.vue')
  },
  {
    path: '/searchproducts',
    name: 'searchproducts',
    component:  () => import(/* webpackChunkName: "about" */ './views/SearchProduct.vue')
  }
]
const router = new VueRouter({
  namespace: 'wxpage',
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
