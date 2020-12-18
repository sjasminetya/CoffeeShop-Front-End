import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import createPersistedState from 'vuex-persistedstate'
import router from '../router/index'
import jwt from 'jsonwebtoken'
import Swal from 'sweetalert2'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    password: '',
    user: {},
    accessToken: null || localStorage.getItem('accessToken'),
    refreshToken: null || localStorage.getItem('refreshToken'),
    userData: ''
  },
  plugins: [createPersistedState()],
  mutations: {
    togglePassword (state) {
      state.password = document.getElementById('password')
      if (state.password.type === 'password') {
        state.password.type = 'text'
      } else {
        state.password.type = 'password'
      }
    },
    SET_USER (state, payload) {
      state.user = payload
      state.accessToken = payload.accessToken
      state.refreshToken = payload.refreshToken
    },
    REMOVE_TOKEN (state) {
      state.accessToken = null
      state.refreshToken = null
    },
    SET_USER_DATA (state, payload) {
      state.userData = payload
    }
  },
  actions: {
    login (context, payload) {
      return new Promise((resolve, reject) => {
        axios.post(`${process.env.VUE_APP_URL_API}/users/login`, payload)
          .then(res => {
            const result = res.data.result
            localStorage.setItem('accessToken', result.accessToken)
            localStorage.setItem('refreshToken', result.refreshToken)
            jwt.verify(result.accessToken, process.env.VUE_APP_ACCESS_TOKEN_KEY, (error, data) => {
              if (!error) {
                delete data.iat
                delete data.exp
                context.commit('SET_USER_DATA', data)
              }
            })
            context.commit('SET_USER', result)
            context.dispatch('interceptorRequest')
            resolve(result)
          })
      })
    },
    updateUserProfile (context, payload) {
      return new Promise((resolve, reject) => {
        axios.patch(`${process.env.VUE_APP_URL_API}/users/profile/${payload.userId}`, payload.formData)
          .then(result => {
            Swal.fire({
              icon: 'success',
              title: 'Succeed',
              text: 'Your personal information has been updated',
              showConfirmButton: false,
              timer: 1500
            })
            resolve(result)
          })
      })
    },
    interceptorRequest (context) {
      axios.interceptors.request.use(function (config) {
        config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`
        return config
      }, function (error) {
        return Promise.reject(error)
      })
    },
    interceptorResponse (context) {
      axios.interceptors.response.use(function (response) {
        return response
      }, function (error) {
        if (error.response.status === 401) {
          if (error.response.data.err.message === 'Invalid Token') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            context.commit('REMOVE_TOKEN')
            alert('dont change token')
            router.push('/auth/login')
          } else if (error.response.data.err.message === 'Access Token expired') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            context.commit('REMOVE_TOKEN')
            alert('token expired')
            router.push('/auth/login')
          }
        }
        return Promise.reject(error)
      })
    }
  },
  getters: {
    isLogin (state) {
      return state.accessToken !== null
    },
    getUserData (state) {
      return state.userData
    }
  },
  modules: {
  }
})
